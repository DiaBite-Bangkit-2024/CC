let fs = require("fs");
let { parse } = require("csv-parse");

let clusterData = [[]];

async function loadCluster() {
  const promises = [];

  for (let i = 0; i < 3; i++) {
    let isFirstRow = true;
    const promise = new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(`./clustered_food/cluster_${i}.csv`)
        .pipe(parse({ delimiter: "," }))
        .on("data", (csvrow) => {
          if (!isFirstRow) {
            data.push(csvrow);
          } else {
            isFirstRow = false; // Skip header row
          }
        })
        .on("end", () => {
          clusterData[i] = data; // Simpan data ke array utama
          resolve(); // Resolusi promise saat selesai membaca file
        })
        .on("error", (err) => {
          reject(err); // Tolak promise jika terjadi error
        });
    });

    promises.push(promise); // Tambahkan promise ke array
  }

  // Tunggu semua promise selesai
  await Promise.all(promises);
  return Promise.resolve(clusterData);
}

module.exports = {
  loadCluster,
};
