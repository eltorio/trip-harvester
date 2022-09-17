
import { launch, Browser } from "puppeteer";

const MAX_REVIEW_PAGE = 1000; // there is 5 reviews per page

type TripadvisorReview = {
  reviewId?: string;
  rating?: number;
  title?: string;
  text?: string;
  exp?: string;
  url?: string;
};

const evaluateTripAdvisorPage = (TRIPADVISOR_USER_REVIEW_BASE: string) => {
  ////////////
  const WAITFOR_LANGUAGE_RADIO_INTERVAL = 1000;
  const WAITFOR_LANGUAGE_RADIO_MAX = 10; //10 loop = 10 000ms
  const parse = () => {
    return new Promise<TripadvisorReview[]>((resolve, reject) => {
      let cLoop = 0;
      let results = [] as TripadvisorReview[];
      (
        document.body.querySelector("#LanguageFilter_0") as HTMLInputElement
      ).click();

      // const acceptButton = document.querySelector(
      //   "#onetrust-accept-btn-handler"
      // );
      // if (acceptButton !== undefined && acceptButton !== null) {
      //   (acceptButton as HTMLElement).click();
      // }
      let interval = setInterval(function () {
        cLoop++;
        if (cLoop > WAITFOR_LANGUAGE_RADIO_MAX) {
          console.log("timedout");
          //console.log(document.documentElement.innerHTML);
          clearInterval(interval);
          resolve(results);
        }
        if (document.querySelector("body").innerText.includes("Google")) {
          console.log(
            "start scraping review in this page\n" + window.location.href
          );
          clearInterval(interval);
          let items = document.body.querySelectorAll("[data-reviewid]");
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let ratingElement = item
              .querySelector(".ui_bubble_rating")
              .getAttribute("class");
            let integer = ratingElement.replace(/[^0-9]/g, "");
            let parsedRating = parseInt(integer) / 10;
            let reviewId = item.getAttribute("data-reviewid");
            let reviewTitle = (
              item.querySelector(
                '[data-test-target="review-title"]'
              ) as HTMLElement
            ).innerText;
            console.log(
              `\t got item ${i + 1} id:${reviewId} title:${reviewTitle}`
            );
            let experience = item
              .querySelectorAll("span")[6]
              .innerText.replace(/^.*: /, "");
            results.push({
              reviewId: reviewId,
              rating: parsedRating,
              title: reviewTitle,
              text: item.querySelectorAll("span")[3].innerHTML,
              exp: experience,
              url: `${TRIPADVISOR_USER_REVIEW_BASE}-r${reviewId}`,
            });
          }
          resolve(results);
        } else {
          console.log(
            `still wait for page being ready (perhaps there is no more element)\n${window.location.href}`
          );
        }
      }, WAITFOR_LANGUAGE_RADIO_INTERVAL);
    });
  };
  //test in devtools with
  // parse().then(result=>{console.log(result)})
  ////////////
  return parse();
};

const processor = (browser: Browser, href: string, tripAdvisorReviewBase:string) => {
  return new Promise<TripadvisorReview[]>((resolve, reject) => {
    browser.newPage().then((page) => {
      page.on("console", (msg) => console.log("BROWSER LOG:", msg.text())); //capture in browser console
      page.goto(href).then((data) => {
        if (!data.ok()) {
          reject(`Error : ${data.status()} ${data.statusText()}`);
        } else {
          page.waitForSelector("body").then((data) => {
            page.waitForSelector("body").then((data) => {
              page.waitForSelector("#LanguageFilter_2").then((data) => {
                page
                  .waitForFunction(
                    'document.querySelector("body").innerText.includes("This review is the subjective")'
                  )
                  .then((data) => {
                    page
                      .waitForSelector("#onetrust-accept-btn-handler", {
                        timeout: 3001,
                      })
                      .then((data) => {
                        page
                          .evaluate(
                            'document.querySelector("#onetrust-accept-btn-handler").click()',
                            { timeout: 3002 }
                          )
                          .then(async (data) => {
                            let review = [] as TripadvisorReview[];
                            for (let i = 0; i < MAX_REVIEW_PAGE; i++) {
                              review = review.concat(
                                await page.evaluate(
                                  evaluateTripAdvisorPage,
                                  tripAdvisorReviewBase
                                )
                              );
                              const aNext = await page.$("span.pageNum + a");
                              if (aNext !== null) {
                                await Promise.all([
                                  page.waitForNavigation(),
                                  page.click("span.pageNum + a"),
                                ]);
                              } else {
                                i = MAX_REVIEW_PAGE + 1;
                                break;
                              }
                            }

                            resolve(review);
                          });
                      });
                  });
              });
            });
          });
        }
      });
    });
  });
};

const tripHarvest = (
  tripAdvisorID: string
): Promise<TripadvisorReview[]> => {
  const TRIPADVISOR_ID = tripAdvisorID;
  const TRIPADVISOR_BASE = "https://www.tripadvisor.com/";
  const TRIPADVISOR_USER_REVIEW_BASE = `${TRIPADVISOR_BASE}ShowUserReviews-${TRIPADVISOR_ID}`;
  const TRIPADVISOR_BASE_ACITVITY = `${TRIPADVISOR_BASE}Attraction_Review-${TRIPADVISOR_ID}-Reviews`; //?filterLang=ALL

  console.log(`Working for : ${TRIPADVISOR_BASE_ACITVITY}`);

  return new Promise<TripadvisorReview[]>((resolve) => {
    launch({
      headless: true,
      devtools: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--window-size=1920,1080",
      ],
    }).then(async (browser: Browser) => {
      let promises = [];

      const href = TRIPADVISOR_BASE_ACITVITY; //`${TRIPADVISOR_BASE_ACITVITY}${subpage}`;

      promises.push(processor(browser, TRIPADVISOR_BASE_ACITVITY,TRIPADVISOR_BASE));
      const reviews = await Promise.all(promises);
      await browser.close();
      console.log(`Retrieved ${reviews[0].length} reviews`);
      resolve(reviews[0]);
    });
  });
};

export {tripHarvest}
export type {TripadvisorReview}