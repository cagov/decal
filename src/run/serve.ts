import { Config } from "../config.js";
import { serve } from "../serve.js";

(async () => {
  const config = await Config.new("throwaway/example-component-library", "decal.config.js");
  serve(config.project, 3000);
})()