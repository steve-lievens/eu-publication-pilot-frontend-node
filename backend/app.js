("use strict");
// --------------------------------------------------------------------------
// Require statements
// --------------------------------------------------------------------------
const http = require("http");
const proxiedHttp = require("findhit-proxywrap").proxy(http, { strict: false });
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const os = require("os");
const { CloudantV1 } = require("@ibm-cloud/cloudant");
const FormData = require("form-data");
const { Readable } = require("stream");
const JSON5 = require("json5");
// --------------------------------------------------------------------------
// Read environment variables
// --------------------------------------------------------------------------

// When not present in the system environment variables, dotenv will take them
// from the local file
require("dotenv-defaults").config({
  path: "my.env",
  encoding: "utf8",
  defaults: "my.env.defaults",
});

// App ENV
const APP_NAME = process.env.APP_NAME;
const CLOUDANT_URL = process.env.CLOUDANT_URL;
const CLOUDANT_APIKEY = process.env.CLOUDANT_APIKEY;
const CLOUDANT_CONCORDANCE_DB = process.env.CLOUDANT_CONCORDANCE_DB;
const WATSONX_APIKEY = process.env.WATSONX_APIKEY;

// --------------------------------------------------------------------------
// Initialization App Logging
// --------------------------------------------------------------------------
console.log("INFO: Here we go ! Starting up the app !!!", APP_NAME);

console.log("INFO: CLOUDANT_URL", CLOUDANT_URL);
console.log("INFO: CLOUDANT_APIKEY", "*******");
console.log("INFO: CLOUDANT_CONCORDANCE_DB", CLOUDANT_CONCORDANCE_DB);
console.log("INFO: WATSONX_APIKEY", "*******");
// --------------------------------------------------------------------------
// Setup the express server
// --------------------------------------------------------------------------
const app = express();

// create application/json parser
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
});

// serve the files out of ./public as our main files
app.use(express.static(path.join(__dirname, "../frontend/build")));

// --------------------------------------------------------------------------
// Express Server runtime
// --------------------------------------------------------------------------
// Start our server !
//app.listen(process.env.PORT || 8080, function () {
//  console.log("INFO: app is listening on port %s", process.env.PORT || 8080);
//});
let expressPort = process.env.PORT || 8080;
const srv = proxiedHttp.createServer(app).listen(expressPort);
console.log("INFO: The application is now listening on port " + expressPort);

// --------------------------------------------------------------------------
// Static Content : also map the root dir to the static folder and paths used by React frontend
// --------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
app.get("/start", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
app.get("/concordance-check", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
app.get("/concordance-check-2", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
app.get("/concordance-check-3", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

// --------------------------------------------------------------------------
// REST API : write concordance data to the cloudant db
// --------------------------------------------------------------------------
app.post("/writeConcordance", jsonParser, async function (req, res) {
  console.log("INFO: Writing concordance data to Cloudant DB");

  // Check if the request body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error("ERROR: Request body is empty");
    return res.status(400).json({ error: "Request body is empty" });
  }

  const client = initCloudantClient();

  try {
    // Add the document to the Cloudant database
    await addDocToCloudant(client, CLOUDANT_CONCORDANCE_DB, req.body);
    res.status(200).json({ message: "Document added successfully" });
  } catch (error) {
    console.error("ERROR: Failed to add document to Cloudant", error);
    res.status(500).json({ error: "Failed to add document to Cloudant" });
  }
});

// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// REST API : proxy the backend api
// --------------------------------------------------------------------------
app.get("/proxybackend", async function (req, res) {
  console.log("INFO: Proxying request to backend API");
  try {
    // Replace the URL below with your actual backend API endpoint
    const response = await fetch(
      "https://eu-pub.1yqyg3g5f8e4.eu-de.codeengine.appdomain.cloud/graph/compare-documents"
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("ERROR: Failed to fetch from backend API", error);
    res.status(500).json({ error: "Failed to fetch from backend API" });
  }
});

app.post("/proxybackend", async function (req, res) {
  console.log("INFO: Proxying multipart/form-data POST to backend API");

  try {
    // Collect the incoming form-data
    const form = new FormData();
    // If using body-parser, you may need to disable it for this route
    // and use req.pipe(form) or a library like multer to parse the form fields/files

    // Pipe the incoming request directly to the backend API
    const apiResponse = await fetch(
      "https://eu-pub.1yqyg3g5f8e4.eu-de.codeengine.appdomain.cloud/graph/compare-documents",
      {
        method: "POST",
        headers: {
          ...req.headers, // Pass all incoming headers
          host: undefined, // Remove 'host' header to avoid conflicts
        },
        body: req, // Stream the incoming request body directly
        duplex: "half",
      }
    );

    // Forward the backend response status and headers
    res.status(apiResponse.status);
    apiResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Pipe the backend response to the client
    const nodeStream = Readable.fromWeb(apiResponse.body);
    nodeStream.pipe(res);
  } catch (error) {
    console.error("ERROR: Failed to proxy multipart POST", error);
    res.status(500).json({ error: "Failed to proxy multipart POST" });
  }
});

// --------------------------------------------------------------------------
// REST API : health
// --------------------------------------------------------------------------
app.get("/health", function (req, res) {
  var health = {
    health: "OK",
  };
  console.log("INFO: Service health returning " + JSON.stringify(health));
  res.json(health);
});

// --------------------------------------------------------------------------
// REST API : retrieve info about the host
// --------------------------------------------------------------------------
app.get("/getEnvironment", function (req, res) {
  var hostobj = {
    app_name: APP_NAME,
    client_ip: req.ip,
  };
  console.log(
    "INFO: Service getEnvironment returning : " + JSON.stringify(hostobj)
  );

  // get all request info from the client
  const echo = {
    path: req.path,
    headers: req.headers,
    method: req.method,
    body: req.body,
    cookies: req.cookies,
    fresh: req.fresh,
    hostname: req.hostname,
    ip: req.ip,
    ips: req.ips,
    protocol: req.protocol,
    query: req.query,
    subdomains: req.subdomains,
    xhr: req.xhr,
    os: {
      hostname: os.hostname(),
    },
    connection: {
      servername: req.servername,
    },
  };

  res.json(hostobj);
});

// --------------------------------------------------------------------------
// REST API : retrieve all docs from the cloudant db
// --------------------------------------------------------------------------
app.post("/analyzeParas", jsonParser, async function (req, res) {
  console.log("INFO: Starting analyzeParas with input : ", req.body);

  let isV2 = false;
  let backendUrl = "";

  // check for v2
  if (req.body.v2) {
    isV2 = true;
  }

  // Possible backends
  const backendENDE =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_de/text/generation?version=2021-05-01";
  const backendENLV =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_lv/text/generation?version=2021-05-01";
  const backendDELV =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_de_lv/text/generation?version=2021-05-01";
  const backendENDEV2 =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_de_v3/text/generation?version=2021-05-01";
  const backendENLVV2 =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_lv_v3/text/generation?version=2021-05-01";
  const backendDELVV2 =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_de_lv_v3/text/generation?version=2021-05-01";

  // Use the language parameters to decide which backend to use
  const primLang = req.body.primLang;
  const secLang = req.body.secLang;

  if (isV2) {
    backendUrl = backendENDEV2;
    if (primLang === "en" && secLang === "de") {
      console.log("INFO: Calling backend for en->de V2");
      backendUrl = backendENDEV2;
    }
    if (primLang === "en" && secLang === "lv") {
      console.log("INFO: Calling backend for en->lv V2");
      backendUrl = backendENLVV2;
    }
    if (primLang === "de" && secLang === "lv") {
      console.log("INFO: Calling backend for de->lv V2");
      backendUrl = backendDELVV2;
    }
  } else {
    if (primLang === "en" && secLang === "de") {
      console.log("INFO: Calling backend for en->de");
      backendUrl = backendENDE;
    }
    if (primLang === "en" && secLang === "lv") {
      console.log("INFO: Calling backend for en->lv");
      backendUrl = backendENLV;
    }
    if (primLang === "de" && secLang === "lv") {
      console.log("INFO: Calling backend for de->lv");
      backendUrl = backendDELV;
    }
  }

  // Create a new body
  let newBody = {
    parameters: req.body.parameters,
  };
  console.log("INFO: newBody: ", newBody);
  // Call the backend
  let retVal = await sendToWatsonx(backendUrl, newBody);

  // Convert the data structure of the response
  if (isV2) {
    // copy the entire retVal object as a new property of retVal
    retVal.originalInput = { ...retVal };
  } else {
    retVal = convertDataStructure(retVal);
  }

  console.log("INFO: response from Watsonx:", retVal);
  res.json(retVal);
});

// --------------------------------------------------------------------------
// REST API : retrieve all docs from the cloudant db
// --------------------------------------------------------------------------
app.post("/judgeParaDiffs", jsonParser, async function (req, res) {
  console.log("INFO: Starting judgeParaDiffs with input : ", req.body);

  //let isV2 = false;
  let backendUrl =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/judge_llm_v1/text/generation?version=2021-05-01";

  /*
  // check for v2
  if (req.body.v2) {
    isV2 = true;
  }

  // Possible backends
  const backendENDE =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_de/text/generation?version=2021-05-01";
  const backendENLV =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_lv/text/generation?version=2021-05-01";
  const backendDELV =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_de_lv/text/generation?version=2021-05-01";
  const backendENDEV2 =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_de_v2/text/generation?version=2021-05-01";
  //const backendENLVV2 =
  ("https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_lv_v2/text/generation?version=2021-05-01");
  const backendENLVV2 =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_en_lv_v3/text/generation?version=2021-05-01";
  const backendDELVV2 =
    "https://eu-de.ml.cloud.ibm.com/ml/v1/deployments/allentities_de_lv_v2/text/generation?version=2021-05-01";

  // Use the language parameters to decide which backend to use
  const primLang = req.body.primLang;
  const secLang = req.body.secLang;

  if (isV2) {
    backendUrl = backendENDEV2;
    if (primLang === "en" && secLang === "de") {
      console.log("INFO: Calling backend for en->de V2");
      backendUrl = backendENDEV2;
    }
    if (primLang === "en" && secLang === "lv") {
      console.log("INFO: Calling backend for en->lv V2");
      backendUrl = backendENLVV2;
    }
    if (primLang === "de" && secLang === "lv") {
      console.log("INFO: Calling backend for de->lv V2");
      backendUrl = backendDELVV2;
    }
  } else {
    if (primLang === "en" && secLang === "de") {
      console.log("INFO: Calling backend for en->de");
      backendUrl = backendENDE;
    }
    if (primLang === "en" && secLang === "lv") {
      console.log("INFO: Calling backend for en->lv");
      backendUrl = backendENLV;
    }
    if (primLang === "de" && secLang === "lv") {
      console.log("INFO: Calling backend for de->lv");
      backendUrl = backendDELV;
    }
  }
*/
  // Create a new body
  let newBody = {
    parameters: {
      prompt_variables: {
        output_previous_llm: req.body,
      },
    },
  };
  console.log("INFO: newBody for judge prompt : ", newBody);
  // Call the backend
  let retVal = await sendToWatsonx(backendUrl, newBody);

  // Convert the data structure of the response
  if (isV2) {
    // copy the entire retVal object as a new property of retVal
    retVal.originalInput = { ...retVal };
  } else {
    retVal = convertDataStructure(retVal);
  }

  console.log("INFO: response from Watsonx:", retVal);
  res.json(retVal);
});

// --------------------------------------------------------------------------
// Helper : Convert the data structure of the json response
// --------------------------------------------------------------------------
function convertDataStructure(data) {
  if (!data.differences) return {};

  let doc1Diffs = [];
  let doc2Diffs = [];

  const doc1Input = data.differences[Object.keys(data.differences)[0]];
  const doc2Input = data.differences[Object.keys(data.differences)[1]];

  // Loop over doc1Input to get types
  if (doc1Input) {
    for (const [key, value] of Object.entries(doc1Input)) {
      if (value && value.length > 0) {
        //console.log("INFO: doc1Input type:", key);
        const typeName = key;

        // Loop over the value array
        for (const item of value) {
          if (item && item.value) {
            /*console.log(
              "INFO: doc1Input item type content:",
              item.value,
              item.originaltext
            );*/

            const typeContent = {
              type: typeName,
              description: item.value,
              originalText: item.originaltext,
            };
            doc1Diffs.push(typeContent);
          }
        }
      }
    }
  }

  if (doc2Input) {
    for (const [key, value] of Object.entries(doc2Input)) {
      if (value && value.length > 0) {
        //console.log("INFO: doc2Input type:", key);
        const typeName = key;

        // Loop over the value array
        for (const item of value) {
          if (item && item.value) {
            /*console.log(
              "INFO: doc2Input item type content:",
              item.value,
              item.originaltext
            );*/

            const typeContent = {
              type: typeName,
              description: item.value,
              originalText: item.originaltext,
            };
            doc2Diffs.push(typeContent);
          }
        }
      }
    }
  }

  // Convert the data structure to the desired format
  const convertedData = {
    doc1: {
      language: Object.keys(data.differences)[0],
      diff: doc1Diffs,
    },
    doc2: {
      language: Object.keys(data.differences)[1],
      diff: doc2Diffs,
    },
    originalInput: data,
  };

  return convertedData;
}

// --------------------------------------------------------------------------
// Helper : Get the current date in YYYY-MM-DD format
// --------------------------------------------------------------------------
function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// Helper : Setup cloudant client
// --------------------------------------------------------------------------
function initCloudantClient() {
  const client = CloudantV1.newInstance({
    serviceName: "CLOUDANT",
  });

  return client;
}

// --------------------------------------------------------------------------
// Helper : get all docs from cloudant db
// --------------------------------------------------------------------------
async function getAllDocsFromDb(client, db_name) {
  let createDocumentResponse = {};

  // get all document
  await client
    .postAllDocs({
      db: db_name,
      includeDocs: true,
    })
    .then((response) => {
      //console.log(response.result);
      createDocumentResponse = response.result;
    })
    .catch((error) => {
      console.log("ERROR: error from DB " + error);
    });

  return createDocumentResponse;
}

// --------------------------------------------------------------------------
// Helper : get all docs from cloudant db
// --------------------------------------------------------------------------
async function getDocFromDbByKey(client, db_name, key) {
  let createDocumentResponse = {};

  // get all document
  await client
    .getDocument({
      db: db_name,
      docId: key,
    })
    .then((response) => {
      //console.log(response.result);
      createDocumentResponse = response.result;
    })
    .catch((error) => {
      console.log("ERROR: error from DB " + error);
    });

  return createDocumentResponse;
}

// --------------------------------------------------------------------------
// Helper : Add doc to db
// --------------------------------------------------------------------------
async function addDocToCloudant(client, dbName, doc) {
  console.log("INFO: Adding doc to Cloudant db " + dbName);
  //console.log(JSON.stringify(doc, null, 2));

  // Create the document
  try {
    const createdDoc = (
      await client.postDocument({
        document: doc,
        db: dbName,
      })
    ).result;

    if (createdDoc.ok) {
      doc._rev = createdDoc.rev;
      console.log("INFO: Document created with response id", createdDoc.id);
      //console.log(JSON.stringify(doc, null, 2));
    }
  } catch (err) {
    if (err.code === 409) {
      console.log("INFO: Cannot create the document, it already exists.");
    } else {
      console.log("ERROR: Cannot create the document with id ", doc._id);
      console.log(err);
    }
  }
}

// --------------------------------------------------------------------------
// Helper : Find multiple results with a regex search
// --------------------------------------------------------------------------
async function searchMultiple(source, regex) {
  // Regex based search in a string and returning an array of results
  const array = [...source.matchAll(regex)];

  return array;
}

// --------------------------------------------------------------------------
// Helper : Remove duplicates from an array
// --------------------------------------------------------------------------
function removeDuplicates(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

// --------------------------------------------------------------------------
// Helper : Combining multiple searches to Cloudant
// --------------------------------------------------------------------------
function searchCloudant(keys, params, languageCode, resolve) {
  const cloudant = new CloudantSDK({
    url: CLOUDANT_URL,
    plugins: { iamauth: { iamApiKey: CLOUDANT_APIKEY } },
  });

  const databaseName = "mydb";

  let i = 0;

  const singleSearchCloudant = (searchItem) =>
    new Promise((resolved, reject) => {
      if (searchItem.text) {
        cloudant
          .use(databaseName)
          .get(searchItem.text)
          .then((answerUnit) => {
            if (answerUnit) {
              console.log("INFO: Found item in Cloudant db");

              if (languageCode == "nl") {
                params.payload.output.generic[i].text = answerUnit.nl;
                console.log("INFO: Content = ", answerUnit.nl);
              } else if (languageCode == "fr") {
                params.payload.output.generic[i].text = answerUnit.fr;
                console.log("INFO: Content = ", answerUnit.fr);
              } else {
                //default to "en"
                params.payload.output.generic[i].text = answerUnit.en;
                console.log("INFO: Content = ", answerUnit.en);
              }
            }
            resolved();
          })
          .catch((error) => {
            console.log("ERROR: error from DB " + error);
            resolved();
          });
      } else if (searchItem.title) {
        cloudant
          .use(databaseName)
          .get(searchItem.title)
          .then((answerUnit) => {
            if (answerUnit) {
              console.log("INFO: Found item in Cloudant db");

              if (languageCode == "nl") {
                params.payload.output.generic[i].title = answerUnit.nl;
                console.log("INFO: Content = ", answerUnit.nl);
              } else if (languageCode == "fr") {
                params.payload.output.generic[i].title = answerUnit.fr;
                console.log("INFO: Content = ", answerUnit.fr);
              } else {
                //default to "en"
                params.payload.output.generic[i].title = answerUnit.en;
                console.log("INFO: Content = ", answerUnit.en);
              }
            }
            resolved();
          })
          .catch((error) => {
            console.log("ERROR: error from DB " + error);
            resolved();
          });
      } else {
        resolved();
      }
    });

  const doAllSearches = async () => {
    for (item of keys) {
      console.log(
        "INFO : Searching for key in : ",
        item,
        ", language : ",
        languageCode
      );
      await singleSearchCloudant(item);
      i++;
    }

    console.log("INFO : All content searches done !");
    resolve();
  };

  doAllSearches();
}

// --------------------------------------------------------------------------
// Helper : watsonx.ai call generative ai
// --------------------------------------------------------------------------
async function sendToWatsonx(url, input) {
  //console.log("INFO: calling deployed prompt with input", input);

  // First create an access token from the API key
  const data = new URLSearchParams();
  data.append("grant_type", "urn:ibm:params:oauth:grant-type:apikey");
  data.append("apikey", WATSONX_APIKEY);
  const access = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data.toString(),
  })
    .then((res) => {
      return res.json();
    })
    .catch((error) => {
      console.log("ERROR : ", error);
      return error;
    });

  const token = access.access_token;

  // Then call the watsonx endpoint with the access token
  const watsonxReply = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(input),
  })
    .then((res) => {
      return res.json();
    })
    .catch((error) => {
      console.log("ERROR : ", error);
      return error;
    });

  //console.log("INFO: watsonx reply", watsonxReply);

  // clean up the reply before sending back
  if (watsonxReply.results && watsonxReply.results.length > 0) {
    // If results exist, get the first result's generated text
    let rawReply = watsonxReply.results[0].generated_text;

    // Clean out any unwanted characters, like the ending ---
    if (rawReply.endsWith("---")) {
      rawReply = rawReply.slice(0, -3);
    }

    // Remove everything before the first {
    const firstBraceIndex = rawReply.indexOf("{");
    if (firstBraceIndex !== -1) {
      rawReply = rawReply.slice(firstBraceIndex);
    }

    // Remove everything after the last }
    const lastBraceIndex = rawReply.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      rawReply = rawReply.slice(0, lastBraceIndex + 1);
    }

    // let's try to parse the JSON string, catch any errors
    let parsedReply = {};
    try {
      parsedReply = JSON5.parse(rawReply);
      //console.log("INFO: parsedReply", parsedReply);
    } catch (error) {
      console.log("ERROR: Failed to parse JSON", error);
      parsedReply = {};
      parsedReply.error = error;
      parsedReply.rawReply = rawReply;
    }

    return parsedReply;
  } else {
    return {};
  }
}
