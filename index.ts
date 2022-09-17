import {tripReviewHarvest} from './trip-harvester'
import * as dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const reviews = await tripReviewHarvest(process.env.TRIPADVISOR_ID,false)
      await fs.writeFile(
        `out-reviews-${process.env.TRIPADVISOR_ID}-${Math.floor(Date.now() / 1000)}.json`,
        JSON.stringify(reviews)
      );