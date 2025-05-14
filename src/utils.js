import fs from "fs/promises";

export async function checkPathExists(path) {
    return fs
        .access(path, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
}
