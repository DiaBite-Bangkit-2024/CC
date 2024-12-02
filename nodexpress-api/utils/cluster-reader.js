let fs = require("fs");
let path = require("path");
let { parse } = require("csv-parse");

let clusterData = [[]];
let columnNames = [];

async function loadCluster() {
  const promises = [];

  for (let i = 0; i < 3; i++) {
    let isFirstRow = true;
    const promise = new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(
        path.join(__dirname, `../clustered_food/cluster_${i}.csv`)
      )
        .pipe(parse({ delimiter: "," }))
        .on("data", (csvrow) => {
          if (!isFirstRow) {
            data.push(csvrow);
          } else {
            columnNames = csvrow;

            isFirstRow = false;
          }
        })
        .on("end", () => {
          clusterData[i] = data;
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    });

    promises.push(promise);
  }

  await Promise.all(promises);
  return Promise.resolve({ clusterData, columnNames });
}

module.exports = {
  loadCluster,
};
