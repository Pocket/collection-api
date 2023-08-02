import { serverLogger, startServer } from './express';
import config from './config';

(async () => {
  const { adminUrl, publicUrl } = await startServer(config.app.port);
  serverLogger.info(
    `🚀 Public server ready at http://localhost:${config.app.port}${publicUrl}`,
  );
  serverLogger.info(
    `🚀 Admin server ready at http://localhost:${config.app.port}${adminUrl}`,
  );
})();
