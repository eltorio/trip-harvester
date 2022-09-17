import {tripHarvest} from './trip-harvester'
import * as dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const reviews = await tripHarvest(process.env.TRIPADVISOR_ID)
      await fs.writeFile(
        `out-${process.env.TRIPADVISOR_ID}-${Math.floor(Date.now() / 1000)}.json`,
        JSON.stringify(reviews)
      );