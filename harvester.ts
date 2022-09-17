import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { launch } from "puppeteer";

dotenv.config()

const TRIPADVISOR_ID = process.env.TRIPADVISOR_ID;
const TRIPADVISOR_BASE = process.env.TRIPADVISOR_BASE;
const TRIPADVISOR_FULL = process.env.TRIPADVISOR_FULL;
const TRIPADVISOR_USER_REVIEW_BASE = `${TRIPADVISOR_BASE}ShowUserReviews-${TRIPADVISOR_ID}`;
const TRIPADVISOR_BASE_ACITVITY = `${TRIPADVISOR_BASE}Attraction_Review-${TRIPADVISOR_ID}-Reviews?filterLang=ALL`;
const TRIPADVISOR_PAGES = [
			process.env.TRIPADVISOR_PAGES_0,
			process.env.RIPADVISOR_PAGES_1,
			process.env.RIPADVISOR_PAGES_2
];

const evaluateTripAdvisorPage = (TRIPADVISOR_USER_REVIEW_BASE) => {
  ////////////
  const parse = () => {
    return new Promise((resolve, reject) => {
      let results = [];
      document.body.querySelector("#LanguageFilter_0").click();
      let interval = setInterval(function () {
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
            let reviewTitle = item.querySelector(
              '[data-test-target="review-title"]'
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
      }, 1000);
    });
  };
  //test in devtools with
  // parse().then(result=>{console.log(result)})
  ////////////
  return parse();
};

const process = (browser, href) => {
  return new Promise((resolve) => {
    browser.newPage().then((page) => {
      page.goto(href).then((data) => {
        page.waitForSelector("body").then((data) => {
          page.waitForSelector("body").then((data) => {
            page.waitForSelector("#LanguageFilter_2").then((data) => {
              page
                .waitForFunction(
                  'document.querySelector("body").innerText.includes("This review is the subjective")'
                )
                .then(
                    resolve(
                        page.evaluate(
                          evaluateTripAdvisorPage,
                          TRIPADVISOR_USER_REVIEW_BASE
                        )
                      )
                );
            });
          });
        });
      });
    });
  });
}
launch({
  headless: true,
  devtools:true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
}).then(async (browser) => {
  let promises = [];

  const href = TRIPADVISOR_BASE_ACITVITY; //`${TRIPADVISOR_BASE_ACITVITY}${subpage}`;

  promises.push(process(browser, TRIPADVISOR_BASE_ACITVITY));
  const reviews = await Promise.all(promises);
  console.log(reviews);
  await browser.close();
});
