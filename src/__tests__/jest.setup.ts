import { DbUtil } from '../dao/DbUtil';
import { getDbConfigFromEnv } from '../dao/DbConfigLoader';

// beforeAll(async () => {
//     const dbConfig = getDbConfigFromEnv();
//     DbUtil.initialize({
//         connection: {
//             host: dbConfig.host,
//             port: dbConfig.port,
//             user: dbConfig.user,
//             password: dbConfig.password,
//             database: dbConfig.database,
//         },
//         pool: {
//             max: dbConfig.connectionLimit,
//             queueLimit: dbConfig.queueLimit,
//             waitForConnections: dbConfig.waitForConnections
//         },
//         debug: process.env.NODE_ENV === 'development'
//     });
// });

// afterAll(async () => {
//     await DbUtil.relaseConnectionPoolAsync();
// }); 