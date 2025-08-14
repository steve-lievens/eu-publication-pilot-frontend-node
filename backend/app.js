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
const CLOUDANT_DELAY = process.env.CLOUDANT_DELAY;
const CLOUDANT_SOURCE_DB = process.env.CLOUDANT_SOURCE_DB;
const CLOUDANT_CONTENT_DB = process.env.CLOUDANT_CONTENT_DB;
const CLOUDANT_EXTRACTS_DB = process.env.CLOUDANT_EXTRACTS_DB;
const CLOUDANT_TARGET_DB = process.env.CLOUDANT_TARGET_DB;
const CLOUDANT_NORMS_DB = process.env.CLOUDANT_NORMS_DB;
const CLOUDANT_LINK_DB = process.env.CLOUDANT_LINK_DB;

// --------------------------------------------------------------------------
// Initialization App Logging
// --------------------------------------------------------------------------
console.log("INFO: Here we go ! Starting up the app !!!", APP_NAME);

console.log("INFO: CLOUDANT_URL", CLOUDANT_URL);
console.log("INFO: CLOUDANT_APIKEY", "*******");
console.log("INFO: CLOUDANT_DELAY", CLOUDANT_DELAY);
console.log("INFO: CLOUDANT_SOURCE_DB", CLOUDANT_SOURCE_DB);
console.log("INFO: CLOUDANT_CONTENT_DB", CLOUDANT_CONTENT_DB);
console.log("INFO: CLOUDANT_EXTRACTS_DB", CLOUDANT_EXTRACTS_DB);
console.log("INFO: CLOUDANT_TARGET_DB", CLOUDANT_TARGET_DB);
console.log("INFO: CLOUDANT_NORMS_DB", CLOUDANT_NORMS_DB);
console.log("INFO: CLOUDANT_LINK_DB", CLOUDANT_LINK_DB);

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
app.get("/newcheck", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});
app.get("/concordance-check", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

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
