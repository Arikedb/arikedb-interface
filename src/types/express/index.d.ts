import { ArikedbCore } from "@arikedb/core";

declare global {
  namespace Express {
    interface Request {
      logger: winston.Logger;
      db_cli: ArikedbCore; // Add your custom property here
    }
  }
}
