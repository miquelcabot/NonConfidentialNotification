const path = require("path");
const fs = require("fs-extra"); // fs with extra functions
const solc = require("solc");

const contractFileName = "Notification.sol";

const buildPath = path.resolve(__dirname, "../src/ethereum/build");
fs.removeSync(buildPath); // Remove the 'build' folder and its content

const contractPath = path.resolve(__dirname, "contracts", contractFileName);
const source = fs.readFileSync(contractPath, "utf8");

console.log("Compiling "+contractFileName+"...");
const output = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath);

for (let contract in output) {
    console.log("Saving "+contract.replace(":", "")+" contract...");
    fs.outputJsonSync(
        path.resolve(buildPath, contract.replace(":", "") + ".json"),
        output[contract],
        {spaces: 2} // Indent json output with 2 spaces
    );
}
