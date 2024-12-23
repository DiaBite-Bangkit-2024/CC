const express = require("express");
const { loadCluster } = require("../utils/cluster-reader");
const router = express.Router();

loadCluster()
  .then(({ clusterData, columnNames, tags }) => {
    console.log("Food Recommendation Ready!");
    router.all("/", async (req, res) => {
      const tags = req.body.tags ||
        JSON.parse(req.query.tags || null) ||
        req.header.tags || ["-"];

      let response = {
        message: "Success get food recommendation!",
        error: false,
        results: {},
        resultCount: {},
      };

      try {
        let results = {};

        clusterData.forEach((cluster, i) => {
          cluster.forEach((row) => {
            if (
              tags.some((tag) =>
                row[0].toLowerCase().includes(tag.toLowerCase())
              )
            ) {
              if (!results[`cluster_${i}`]) {
                results[`cluster_${i}`] = [];
              }
              rowData = {};
              for (const r in row) {
                rowData[columnNames[r]] = row[r];
              }

              results[`cluster_${i}`].push(rowData);
            }
          });
          response.resultCount[`cluster_${i}`] =
            results[`cluster_${i}`]?.length || 0;
        });

        response.results = results;

        res.status(200).json(response);
      } catch (error) {
        response.message = "Error processing request : " + error;
        response.error = true;
        res.status(500).json(response);
      }
    });

    router.all("/tags", (req, res) => {
      return res.status(200).json({ tags, message: "success", error: false });
    });
  })
  .catch((err) => {
    console.error("Error loading cluster data:", err);
  });

module.exports = router;
