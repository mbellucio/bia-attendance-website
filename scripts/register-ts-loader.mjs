import { register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
register(new URL("./resolve-ts-loader.mjs", import.meta.url).href, pathToFileURL(process.cwd() + path.sep));
