import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Heading,
  Accordion,
  AccordionItem,
  Theme,
  Table,
  TableBody,
  TableRow,
  TableCell,
  ExpandableTile,
  TileAboveTheFoldContent,
  TileBelowTheFoldContent,
} from "@carbon/react";
import { FilterEdit } from "@carbon/react/icons";
import styles from "./ConcordanceCheck3.module.css";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Marker } from "react-mark.js";

interface Difference {
  entitytype: string;
  entityvaluelang1: string;
  originaltextlang1: string;
  entityvaluelang2: string;
  originaltextlang2: string;
  explanation: string;
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
  const dataInit = {
    docA: retData[0].file,
    docB: retData[1].file,
    paragraphsA: retData[0].para,
    paragraphsB: retData[1].para,
  };
  const [docData, setDocData] = useState<DocumentData>(dataInit);
  const [highlightedPara, setHighlightedPara] = useState<number | null>(null);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[]>([]);
  const [loadingTitle, setLoadingTitle] = useState<string>("Analyzing ...");

  const paragraphRef = useRef<(HTMLDivElement | null)[]>([]);

  console.log("ConcordanceCheck3 data:", dataInit);

  const analyzeParagraph = async (
    paragraphA: ParagraphData,
    paragraphB: ParagraphData
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
    for (let i = 0; i < docData.paragraphsA.length; i++) {
      console.log("INFO: Starting analysis of paragraph ", i + 1);
      const result = await analyzeParagraph(
        docData.paragraphsA[i],
        docData.paragraphsB[i]
      );
      console.log("INFO: Result for paragraph ", i + 1, ":", result);

      // Only add non-empty results
      if (result.diffs.differences && result.diffs.differences.length > 0) {
        // or any other properties your DifferencesData type requires
        results.push(result);

        // add the highlighted texts to the paragraphs, remove any ' chars in the string
        docData.paragraphsA[i].highlights = result.diffs.differences.map(
          (diff) => {
            const highlight = diff.originaltextlang1.replace(/['"]/g, "");
            return highlight;
          }
        );
        docData.paragraphsB[i].highlights = result.diffs.differences.map(
          (diff) => {
            const highlight = diff.originaltextlang2.replace(/['"]/g, "");
            return highlight;
          }
        );

        //setDocData(docData);

        console.log("INFO: Differences found for paragraph ", i + 1);
      } else {
        console.log("INFO: No differences found for paragraph ", i + 1);
      }
      setAnalysisResult([...results]);
    }

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

  if (!docData) return <p>Error: no data.</p>;

  // Render both documents in a table, with each paragraph in a row
  // !!!!!!!!! Still needs error handling when both docs don't have the same number of paragraphs
  const renderDocuments = (
    doc1: string,
    doc2: string,
    paragraphA: ParagraphData[],
    paragraphB: ParagraphData[],
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
          key={index}
          className={
            highlightedPara !== null && highlightedPara - 1 === index
              ? styles.highlight
              : ""
          }
        >
          <TableCell>
            <div
              key={index}
              ref={(el) => {
                paraRef.current[index] = el;
              }}
            >
              {index + 1}
            </div>
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

  const renderDifferences = (diffs: DifferencesData, paraNr: number) => {
    // Return the differences nicely formatted
    return (
      <div>
        <div className={styles.differenceHeader}>
          <ExpandableTile
            id={"ExpandableTile" + paraNr}
            tileCollapsedIconText="Interact to Expand tile"
            tileExpandedIconText="Interact to Collapse tile"
          >
            <TileAboveTheFoldContent>
              {
                // Loop over the differences and display them
                diffs.differences.map((diff, index) => (
                  <div key={index} className={styles.diffItem}>
                    <strong>Entity Type:</strong> {diff.entitytype} <br />
                    <strong>Entity Value (Lang 1):</strong>{" "}
                    {diff.entityvaluelang1} <br />
                    <strong>Original Text (Lang 1):</strong>{" "}
                    {diff.originaltextlang1} <br />
                    <strong>Entity Value (Lang 2):</strong>{" "}
                    {diff.entityvaluelang2} <br />
                    <strong>Original Text (Lang 2):</strong>{" "}
                    {diff.originaltextlang2} <br />
                    <strong>Explanation:</strong> {diff.explanation}
                  </div>
                ))
              }
            </TileAboveTheFoldContent>
            <TileBelowTheFoldContent>
              {JSON.stringify(diffs.originalInput)}
            </TileBelowTheFoldContent>
          </ExpandableTile>
        </div>
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
                {analysisResult.length > 0 ? (
                  analysisResult.map((result, index) => (
                    <AccordionItem
                      title={`Paragraph ${result.paraNumber} Differences`}
                      open={true}
                      key={index}
                      className={styles.accordionItem}
                      onClick={() => {
                        console.log("Clicked on paragraph", result.paraNumber);
                        scrollToDiv(result.paraNumber);
                      }}
                    >
                      {renderDifferences(result.diffs, result.paraNumber)}
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
