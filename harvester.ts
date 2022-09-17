import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { launch, Browser } from "puppeteer";

dotenv.config();

const TRIPADVISOR_ID = process.env.TRIPADVISOR_ID;
const TRIPADVISOR_BASE = process.env.TRIPADVISOR_BASE;
const TRIPADVISOR_FULL = process.env.TRIPADVISOR_FULL;
const TRIPADVISOR_USER_REVIEW_BASE = `${TRIPADVISOR_BASE}ShowUserReviews-${TRIPADVISOR_ID}`;
const TRIPADVISOR_BASE_ACITVITY = `${TRIPADVISOR_BASE}Attraction_Review-${TRIPADVISOR_ID}-Reviews?filterLang=ALL`;
const TRIPADVISOR_PAGES = [
  process.env.TRIPADVISOR_PAGES_0,
  process.env.RIPADVISOR_PAGES_1,
  process.env.RIPADVISOR_PAGES_2,
];

console.log(`Working for : ${TRIPADVISOR_USER_REVIEW_BASE}`);

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
      let interval = setInterval(function () {
        cLoop++;
        if (cLoop > WAITFOR_LANGUAGE_RADIO_MAX) {
          console.log("timedout");
          console.log(document.documentElement.innerHTML);
          clearInterval(interval);
          reject("timedout");
        }
        if (document.querySelector("body").innerText.includes("Google")) {
          console.log("catched");
          clearInterval(interval);
          let items = document.body.querySelectorAll("[data-reviewid]");
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            console.log(i);
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
          console.log("reloaded");
        }
      }, WAITFOR_LANGUAGE_RADIO_INTERVAL);
    });
  };
  //test in devtools with
  // parse().then(result=>{console.log(result)})
  ////////////
  return parse();
};

const processor = (browser: Browser, href: string) => {
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
                    resolve(
                      page.evaluate(
                        evaluateTripAdvisorPage,
                        TRIPADVISOR_USER_REVIEW_BASE
                      )
                    );
                  });
              });
            });
          });
        }
      });
    });
  });
};
launch({
  headless: false,
  devtools: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
}).then(async (browser: Browser) => {
  let promises = [];

  const href = TRIPADVISOR_BASE_ACITVITY; //`${TRIPADVISOR_BASE_ACITVITY}${subpage}`;

  promises.push(processor(browser, TRIPADVISOR_BASE_ACITVITY));
  const reviews = await Promise.all(promises);
  console.log(reviews);
  await browser.close();
});
