import { startServer } from './express';
import config from './config';

(async () => {
  const { adminUrl, publicUrl } = await startServer(config.app.port);
  console.log(
    `🚀 Public server ready at http://localhost:${config.app.port}${publicUrl}`
  );
  console.log(
    `🚀 Admin server ready at http://localhost:${config.app.port}${adminUrl}`
  );
})();
