import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  AILabel,
  AILabelContent,
  Button,
  Heading,
  Accordion,
  AccordionItem,
  Column,
  FluidForm,
  Grid,
  Theme,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextInput,
  Tile,
} from "@carbon/react";
import {
  AiGovernanceTracked,
  AiGovernanceUntracked,
  FilterEdit,
  Hourglass,
  ThumbsUp,
  ThumbsDown,
} from "@carbon/react/icons";
import styles from "./ConcordanceCheck3.module.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Marker } from "react-mark.js";
import { v4 as uuidv4 } from "uuid";

interface Ruling {
  evaluation: boolean;
}

interface Difference {
  entitytype: string;
  entityvaluelang1: string;
  originaltextlang1: string;
  entityvaluelang2: string;
  originaltextlang2: string;
  explanation: string;
  ruling?: boolean;
  showFeedback?: boolean;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
  thumbsDownSent?: boolean;
  feedbackSent?: boolean;
}

interface DifferencesData {
  differences: Difference[];
  originalInput: String; // Adjust type as needed
}

interface DocumentData {
  docA: string;
  docB: string;
  paragraphsA: ParagraphData[];
  paragraphsB: ParagraphData[];
  LangA: string;
  LangB: string;
  analysisReady: number[];
}

interface ParagraphData {
  para: string;
  para_number: number;
  highlights?: string[];
}

interface AnalysisResult {
  diffs: DifferencesData;
  paraNumber: number;
}

const ConcordanceCheck3b: React.FC = () => {
  const location = useLocation();
  const retData = location.state;

  // Create an array of booleans (value false), size equal the amount of paragraphs
  const analysisReady = Array(retData[0].para.length).fill(0);

  let dataInit = {
    docA: retData[0].file,
    docB: retData[1].file,
    paragraphsA: retData[0].para,
    paragraphsB: retData[1].para,
    LangA: retData[2].primaryLanguage,
    LangB: retData[2].secondaryLanguage,
    analysisReady: analysisReady,
  };

  // based on the language input, swap the languages if necessary
  if (retData[2].primaryLanguage === "lv") {
    dataInit = {
      docA: retData[1].file,
      docB: retData[0].file,
      paragraphsA: retData[1].para,
      paragraphsB: retData[0].para,
      LangA: retData[2].secondaryLanguage,
      LangB: retData[2].primaryLanguage,
      analysisReady: analysisReady,
    };
  }

  if (
    retData[2].primaryLanguage === "de" &&
    retData[2].secondaryLanguage === "en"
  ) {
    dataInit = {
      docA: retData[1].file,
      docB: retData[0].file,
      paragraphsA: retData[1].para,
      paragraphsB: retData[0].para,
      LangA: retData[2].secondaryLanguage,
      LangB: retData[2].primaryLanguage,
      analysisReady: analysisReady,
    };
  }

  const [docData, setDocData] = useState<DocumentData>(dataInit);
  const [highlightedPara, setHighlightedPara] = useState<number | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [loadingTitle, setLoadingTitle] = useState<string>("Analyzing ...");
  const [sessionKey, setSessionKey] = useState<string>(uuidv4());

  const paragraphRef = useRef<(HTMLDivElement | null)[]>([]);

  console.log("ConcordanceCheck3 data:", dataInit);

  const createNewConcordanceRecord = async (nrOfAnalysis: number) => {
    console.log("INFO: Starting creation of db record for this check");

    // Send the feedback to the backend by calling the /writeConcordanceFeedback endpoint
    let inputData = {
      _id: sessionKey,
      docA: docData.docA,
      docB: docData.docB,
      paragraphCount: docData.paragraphsA.length,
      analysisCount: nrOfAnalysis,
      timestamp: new Date().toISOString(),
    };
    let formData = JSON.stringify(inputData);
    console.log("Sending feedback data to backend:", formData);
    try {
      const response = await axios.post("/writeConcordanceRecord", formData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      console.log("Feedback response:", response.data);
    } catch (error) {
      console.error("Error sending feedback:", error);
    } finally {
    }
  };

  const judgeParaDiff = async (resultAnalysis: Object): Promise<Ruling> => {
    console.log("Judging paragraph result:", resultAnalysis);

    let resultData = {};
    let formData = JSON.stringify(resultAnalysis);

    console.log("Sending data to judge backend:", formData);

    // Send the data to the backend for analysis
    try {
      const response = await axios.post("/judgeParaDiffs", formData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      console.log("Parsing response:");
      resultData = response.data;

      console.log("Judge result:", resultData);
    } catch (error) {
      console.error("Error starting analysis:", error);
    } finally {
    }
    const resultDataFull: Ruling = resultData as Ruling;
    console.log("Judging completed");
    return resultDataFull;
  };

  const analyzeParagraph = async (
    paragraphA: ParagraphData,
    paragraphB: ParagraphData,
    primLang: string,
    secLang: string
  ): Promise<AnalysisResult> => {
    // Placeholder for analysis logic
    //console.log("Analyzing paragraph:", paragraphA, paragraphB);

    let inputData = {
      parameters: {
        prompt_variables: {
          paragraphs_language_one: paragraphA.para,
          paragraphs_language_two: paragraphB.para,
        },
      },
      primLang: primLang,
      secLang: secLang,
      v2: true,
    };

    let formData = JSON.stringify(inputData);

    let resultData = {
      diffs: {} as DifferencesData,
      paraNumber: paragraphA.para_number,
    };
    console.log("Sending data to backend:", formData);

    // Send the data to the backend for analysis
    try {
      const response = await axios.post("/analyzeParas", formData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      console.log("Parsing response:");
      //console.log(response.data.results[0].generated_text);

      const resultFullAsDifferencesData: DifferencesData =
        response.data as DifferencesData;
      console.log("Result :", resultFullAsDifferencesData);

      // check if the result has differences
      if (
        resultFullAsDifferencesData &&
        resultFullAsDifferencesData.differences &&
        resultFullAsDifferencesData.differences.length > 0
      ) {
        console.log("Differences found:", resultFullAsDifferencesData);
        resultData.diffs = resultFullAsDifferencesData;
      }
      console.log("Analysis result:", resultData);
    } catch (error) {
      console.error("Error starting analysis:", error);
    } finally {
    }

    // Get the actual analysis result
    //const analysisResult = response.data;

    console.log("Analysis completed for paragraph:", paragraphA.para_number);
    return resultData;
  };
  const analyzeParagraphs = async () => {
    const results = [];
    let analysisCount = 0;
    for (let i = 0; i < docData.paragraphsA.length; i++) {
      console.log("INFO: Starting analysis of paragraph ", i + 1);
      const result = await analyzeParagraph(
        docData.paragraphsA[i],
        docData.paragraphsB[i],
        docData.LangA,
        docData.LangB
      );
      console.log("INFO: Result for paragraph ", i + 1, ":", result);

      // Only add non-empty results
      if (result.diffs.differences && result.diffs.differences.length > 0) {
        // For Results with differences, also call the LLM as a judge and add the results of that to this result.
        // Loop over all the differences
        for (let i = 0; i < result.diffs.differences.length; i++) {
          // Build the single difference object
          let singleDif = { differences: [result.diffs.differences[i]] };
          const ruling = await judgeParaDiff(singleDif);
          console.log("INFO: Judge result for paragraph ", i + 1, ":", ruling);

          // Add the ruling to the result
          result.diffs.differences[i].ruling = ruling.evaluation;
          result.diffs.differences[i].showFeedback = false;
          result.diffs.differences[i].thumbsUp = false;
          result.diffs.differences[i].thumbsDown = false;
          result.diffs.differences[i].thumbsDownSent = false;
          result.diffs.differences[i].feedbackSent = false;

          analysisCount++;
        }

        // Set the analysisReady to processed, no diffs
        docData.analysisReady[i] = 2;

        // or any other properties your DifferencesData type requires
        results.push(result);

        // add the highlighted texts to the paragraphs, remove any ' chars in the string
        let highlightA = result.diffs.differences.map((diff) => {
          // split the original Text when there is a pipe charachter
          const tmpHighlights = diff.originaltextlang1.split("|");
          let retHighlights = [];

          // Strip the outer single quotes
          // loop over tmpHighlights
          for (let tmpHighlight of tmpHighlights) {
            retHighlights.push(tmpHighlight.replace(/['"]/g, ""));
          }

          return retHighlights;
        });
        docData.paragraphsA[i].highlights = highlightA.flat(1);

        let highlightB = result.diffs.differences.map((diff) => {
          // split the original Text when there is a pipe charachter
          const tmpHighlights = diff.originaltextlang2.split("|");
          let retHighlights = [];

          // Strip the outer single quotes
          // loop over tmpHighlights
          for (let tmpHighlight of tmpHighlights) {
            retHighlights.push(tmpHighlight.replace(/['"]/g, ""));
          }

          return retHighlights;
        });
        docData.paragraphsB[i].highlights = highlightB.flat();

        //setDocData(docData);

        console.log("INFO: Differences found for paragraph ", i + 1);
      } else {
        console.log("INFO: No differences found for paragraph ", i + 1);
        // Set the analysisReady to processed, no diffs
        docData.analysisReady[i] = 1;
      }
      setAnalysisResults([...results]);
    }

    // Also create a new concordance record in the database
    console.log("INFO: Creating new concordance record in the database");
    createNewConcordanceRecord(analysisCount);

    setLoadingTitle("No differences found");
  };

  const memoizedAnalyzeParagraphs = useCallback(analyzeParagraphs, [
    docData.paragraphsA,
    docData.paragraphsB,
  ]);

  // This code start to run on page load
  useEffect(() => {
    if (!analysisDone) {
      // Analyze paragraphs and set the result
      console.log("INFO: Starting analysis...");
      memoizedAnalyzeParagraphs();
      setAnalysisDone(true);
    }
  }, [analysisDone, memoizedAnalyzeParagraphs]);

  const scrollToDiv = (idx: number) => {
    console.log("Scrolling to paragraph:", idx);
    paragraphRef.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Highlight the paragraph
    setHighlightedPara(idx);
  };

  const handleThumbsDown =
    (diff: Difference, diffNr: number, paraNr: number, diffIndex: number) =>
    async () => {
      console.log("Thumbs down clicked for paragraph", paraNr, diff);
      console.log(docData.paragraphsA[paraNr - 1]);
      console.log(docData.paragraphsB[paraNr - 1]);

      // If thumbs up has been clicked before, ignore the thumbs down click
      if (analysisResults[diffNr].diffs.differences[diffIndex].thumbsUp) {
        console.log("Thumbs up already clicked, ignoring thumbs down");
        return;
      }

      // If feedback has been sent before, ignore the thumbs up click
      if (analysisResults[diffNr].diffs.differences[diffIndex].feedbackSent) {
        console.log("Thumbs down feedback already sent, ignoring thumbs up");
        return;
      }

      // Show the feedback input field if it's not shown, if it is shown, hide it
      if (analysisResults[diffNr].diffs.differences[diffIndex].showFeedback) {
        analysisResults[diffNr].diffs.differences[diffIndex].showFeedback =
          false;
      } else {
        analysisResults[diffNr].diffs.differences[diffIndex].showFeedback =
          true;
      }

      setAnalysisResults([...analysisResults]);
    };
  const handleThumbsUp =
    (diff: Difference, diffNr: number, paraNr: number, diffIndex: number) =>
    async () => {
      console.log("Thumbs down clicked for paragraph", paraNr, diff);

      // If thumbs down feedback has been sent before, ignore the thumbs up click
      if (analysisResults[diffNr].diffs.differences[diffIndex].thumbsDownSent) {
        console.log("Thumbs down feedback already sent, ignoring thumbs up");
        return;
      }

      // If feedback has been sent before, ignore the thumbs up click
      if (analysisResults[diffNr].diffs.differences[diffIndex].feedbackSent) {
        console.log("Thumbs up feedback already sent, ignoring thumbs up");
        return;
      }

      // Send the feedback to the backend by calling the /writeConcordanceFeedback endpoint
      let inputData = {
        sessionKey: sessionKey,
        feedbacktype: "thumbsUp",
        docA: docData.docA,
        docB: docData.docB,
        LangA: docData.LangA,
        LangB: docData.LangB,
        paragraphNumber: paraNr,
        paragraphA: docData.paragraphsA[paraNr - 1].para,
        paragraphB: docData.paragraphsB[paraNr - 1].para,
        difference: diff,
        feedback: "User indicated thumbs up feedback",
      };
      let formData = JSON.stringify(inputData);
      console.log("Sending feedback data to backend:", formData);
      try {
        const response = await axios.post(
          "/writeConcordanceFeedback",
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        console.log("Feedback response:", response.data);
      } catch (error) {
        console.error("Error sending feedback:", error);
      } finally {
      }

      // Mark that the thumbs up feedback has been given
      analysisResults[diffNr].diffs.differences[diffIndex].thumbsUp = true;
      analysisResults[diffNr].diffs.differences[diffIndex].feedbackSent = true;
      setAnalysisResults([...analysisResults]);
    };

  const handleSendFeedback =
    (diff: Difference, diffNr: number, paraNr: number, diffIndex: number) =>
    async () => {
      console.log("Send feedback clicked for paragraph", paraNr, diff);
      console.log("diffIndex:", diffIndex);
      console.log("Feedback text:");

      // create the request body
      const feedbackInput = (
        document.getElementById(
          "feedback-" + paraNr + "-" + diffIndex
        ) as HTMLInputElement | null
      )?.value;
      console.log("Feedback input:", feedbackInput);

      // Send the feedback to the backend by calling the /writeConcordanceFeedback endpoint
      let inputData = {
        sessionKey: sessionKey,
        feedbacktype: "thumbsDown",
        docA: docData.docA,
        docB: docData.docB,
        LangA: docData.LangA,
        LangB: docData.LangB,
        paragraphNumber: paraNr,
        paragraphA: docData.paragraphsA[paraNr - 1].para,
        paragraphB: docData.paragraphsB[paraNr - 1].para,
        difference: diff,
        feedback: feedbackInput,
      };
      let formData = JSON.stringify(inputData);
      console.log("Sending feedback data to backend:", formData);
      try {
        const response = await axios.post(
          "/writeConcordanceFeedback",
          formData,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        console.log("Feedback response:", response.data);
      } catch (error) {
        console.error("Error sending feedback:", error);
      } finally {
      }

      // Hide the feedback input field
      analysisResults[diffNr].diffs.differences[diffIndex].showFeedback = false;
      analysisResults[diffNr].diffs.differences[diffIndex].thumbsDownSent =
        true;
      analysisResults[diffNr].diffs.differences[diffIndex].feedbackSent = true;
      setAnalysisResults([...analysisResults]);
    };

  // Abort if no data
  if (!docData) return <p>Error: no data.</p>;

  // Render both documents in a table, with each paragraph in a row
  // !!!!!!!!! Still needs error handling when both docs don't have the same number of paragraphs
  const renderDocuments = (
    doc1: string,
    doc2: string,
    paragraphA: ParagraphData[],
    paragraphB: ParagraphData[],
    analysisReady: number[],
    paraRef: React.RefObject<(HTMLDivElement | null)[]>,
    highlightedPara: number | null
  ) => {
    if (paragraphA.length !== paragraphB.length) {
      console.error("Paragraphs count mismatch between documents");
      return (
        <TableRow>
          <TableCell>
            Error: Paragraphs count mismatch between documents.
          </TableCell>
        </TableRow>
      );
    }
    return paragraphA.map((para, index) => {
      //console.log("Rendering paragraph", para);
      return (
        <TableRow
          key={"para-row-" + index}
          className={
            highlightedPara !== null && highlightedPara - 1 === index
              ? styles.highlight
              : ""
          }
        >
          <TableCell className={styles.noPadding}>
            <Grid className={styles.noPadding}>
              <Column lg={8} md={4} sm={2}>
                <div
                  className={
                    analysisReady[index] === 1 || analysisReady[index] === 2
                      ? styles.hidden
                      : ""
                  }
                >
                  <Hourglass />
                </div>
                <div
                  className={
                    analysisReady[index] === 0 || analysisReady[index] === 2
                      ? styles.hidden
                      : ""
                  }
                >
                  <AiGovernanceTracked className={styles.iconGreen} />
                </div>
                <div
                  className={
                    analysisReady[index] === 0 || analysisReady[index] === 1
                      ? styles.hidden
                      : ""
                  }
                >
                  <AiGovernanceUntracked className={styles.iconRed} />
                </div>
              </Column>
              <Column lg={8} md={4} sm={2}>
                <div
                  key={"para-column1-" + index}
                  ref={(el) => {
                    paraRef.current[index] = el;
                  }}
                >
                  {index + 1}
                </div>
              </Column>
            </Grid>
          </TableCell>
          <TableCell className={styles.paraTableCell}>
            <Marker
              mark={para.highlights}
              options={{
                separateWordSearch: false,
              }}
            >
              {para.para}
            </Marker>
          </TableCell>
          <TableCell className={styles.paraTableCell}>
            <Marker
              mark={paragraphB[index].highlights}
              options={{
                separateWordSearch: false,
              }}
            >
              {paragraphB[index].para}
            </Marker>
          </TableCell>
        </TableRow>
      );
    });
  };

  const renderDifferences = (
    diffs: DifferencesData,
    diffNr: number,
    paraNr: number
  ) => {
    // Return the differences nicely formatted
    return (
      <div>
        <Tile
          id={`aitile-${paraNr}`}
          decorator={
            <AILabel className="ai-label-container">
              <AILabelContent>
                <div>
                  <p className={styles.aiBoxTitle}>watsonx return data</p>
                  <br />
                  <div className={styles.aiBoxContent}>
                    {JSON.stringify(diffs.originalInput)}
                  </div>
                </div>
              </AILabelContent>
            </AILabel>
          }
        >
          {
            // Loop over the differences and display them
            diffs.differences.map((diff, index) => (
              <div key={"TileAbove" + index}>
                <div className={diff.ruling ? styles.nothing : styles.diffItem}>
                  <strong>{diff.entitytype}</strong> <br />
                  <br />
                  <strong>{docData.LangA}:</strong>{" "}
                  {diff.originaltextlang1.replace(/\|/g, " ")} <br />
                  <strong>{docData.LangB}:</strong>{" "}
                  {diff.originaltextlang2.replace(/\|/g, " ")} <br />
                  <strong>Explanation:</strong> {diff.explanation}
                  <br />
                  <br />
                </div>
                <div className={styles.thumbsUpDownArea}>
                  <ThumbsUp
                    onClick={handleThumbsUp(diff, diffNr, paraNr, index)}
                    className={
                      styles.thumbsUpDown +
                      " " +
                      (diff.thumbsUp ? " " + styles.iconGreen : "")
                    }
                  />
                  <ThumbsDown
                    onClick={handleThumbsDown(diff, diffNr, paraNr, index)}
                    className={
                      styles.thumbsUpDown +
                      " " +
                      (diff.thumbsDownSent ? " " + styles.iconRed : "")
                    }
                  />
                </div>
                <div
                  className={diff.showFeedback ? styles.visible : styles.hidden}
                >
                  <div className={styles.thumbsFeedbackArea}>
                    <FluidForm
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          //handleSendFeedback(diff, diffNr, paraNr, index)();
                        }
                      }}
                    >
                      <TextInput
                        className={styles.thumbsFeedbackTextInput}
                        type="text"
                        labelText="Please provide your feedback"
                        id={"feedback-" + paraNr + "-" + index}
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) => e.preventDefault()}
                      />
                    </FluidForm>
                    <Button
                      className={styles.sendButton}
                      size="sm"
                      onClick={handleSendFeedback(diff, diffNr, paraNr, index)}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            ))
          }
        </Tile>
      </div>
    );
  };

  return (
    <div>
      <Heading className={styles.title}>
        Comparing: {docData.docA} vs {docData.docB}
      </Heading>

      <div className={styles.pageWrapper3}>
        <div className={styles.tableWrapper3}>
          <Theme theme="g10">
            <Table
              aria-label="document table"
              background-color="white"
              className={styles.tableFixed}
            >
              <TableBody>
                {renderDocuments(
                  docData.docA,
                  docData.docB,
                  docData.paragraphsA,
                  docData.paragraphsB,
                  docData.analysisReady,
                  paragraphRef,
                  highlightedPara
                )}
              </TableBody>
            </Table>
          </Theme>
        </div>

        <div className={styles.outputWrapper}>
          <Heading className={styles.outputTitle}>
            Concordance Output
            <span className={styles.filterIcon}>
              <FilterEdit />
            </span>
          </Heading>

          <div className={styles.accordionContainer}>
            <div className={styles.discrepanciesContainer}>
              <Accordion className={styles.accordion}>
                {analysisResults.length > 0 ? (
                  analysisResults.map((result, index) => (
                    <AccordionItem
                      title={`Paragraph ${result.paraNumber} Differences`}
                      open={true}
                      key={"AccordionItem" + index}
                      className={styles.accordionItem}
                      onClick={() => {
                        console.log("Clicked on paragraph", result.paraNumber);
                        scrollToDiv(result.paraNumber);
                      }}
                    >
                      {renderDifferences(
                        result.diffs,
                        index,
                        result.paraNumber
                      )}
                    </AccordionItem>
                  ))
                ) : (
                  <AccordionItem
                    title={loadingTitle}
                    open={false}
                    className={styles.accordionItem}
                  >
                    Nothing found
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcordanceCheck3b;
