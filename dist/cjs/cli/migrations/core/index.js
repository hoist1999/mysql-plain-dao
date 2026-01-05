"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMigrationApplied = exports.isMigrationApplied = exports.getAppliedMigrations = exports.ensureMigrationsTable = void 0;
__exportStar(require("./Types"), exports);
var MigrationTable_1 = require("./MigrationTable");
Object.defineProperty(exports, "ensureMigrationsTable", { enumerable: true, get: function () { return MigrationTable_1.ensureMigrationsTable; } });
Object.defineProperty(exports, "getAppliedMigrations", { enumerable: true, get: function () { return MigrationTable_1.getAppliedMigrations; } });
Object.defineProperty(exports, "isMigrationApplied", { enumerable: true, get: function () { return MigrationTable_1.isMigrationApplied; } });
Object.defineProperty(exports, "recordMigrationApplied", { enumerable: true, get: function () { return MigrationTable_1.recordMigrationApplied; } });
__exportStar(require("./MigrationLoader"), exports);
__exportStar(require("./MigrationRunner"), exports);
//# sourceMappingURL=index.js.map