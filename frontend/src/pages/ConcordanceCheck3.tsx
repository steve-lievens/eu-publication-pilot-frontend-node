import React, { useState, useRef, useEffect } from "react";
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
  type: string;
  description: string;
  originalText: string;
}

interface DocData {
  language: string;
  diff: Difference[];
}

interface DifferencesData {
  doc1: DocData;
  doc2: DocData;
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

const ConcordanceCheck3: React.FC = () => {
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
      if (resultFullAsDifferencesData.doc1) {
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
      if (
        result.diffs !== null &&
        "doc1" in result.diffs &&
        "doc2" in result.diffs
      ) {
        // or any other properties your DifferencesData type requires
        results.push(result);

        // add the highlighted texts to the paragraphs
        docData.paragraphsA[i].highlights = result.diffs.doc1.diff.map(
          (diff) => diff.originalText
        );
        docData.paragraphsB[i].highlights = result.diffs.doc2.diff.map(
          (diff) => diff.originalText
        );

        setDocData(docData);

        console.log("INFO: Differences found for paragraph ", i + 1);
      } else {
        console.log("INFO: No differences found for paragraph ", i + 1);
      }
      setAnalysisResult([...results]);
    }

    setLoadingTitle("No differences found");
  };

  // This code start to run on page load
  useEffect(() => {
    if (!analysisDone) {
      // Analyze paragraphs and set the result
      console.log("INFO: Starting analysis...");
      analyzeParagraphs();
      setAnalysisDone(true);
    }
  }, [analysisDone]);

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
    // get doc1 first
    const doc1Diffs = diffs.doc1.diff;
    const doc2Diffs = diffs.doc2.diff;

    if (!doc1Diffs || !doc2Diffs) {
      return <p>No differences found.</p>;
    }

    // Return the language and type of differences and then loop through the differences
    return (
      <div>
        <div className={styles.differenceHeader}>
          <ExpandableTile
            id={"ExpandableTile" + paraNr}
            tileCollapsedIconText="Interact to Expand tile"
            tileExpandedIconText="Interact to Collapse tile"
          >
            <TileAboveTheFoldContent>
              {doc1Diffs.map((diff, index) => (
                <li key={index}>
                  <strong>{diff.type}:</strong>
                  <p>{diffs.doc1.language + " : " + diff.originalText}</p>
                  <p>
                    {
                      // Display the corresponding doc2 difference if it exists
                      doc2Diffs[index]
                        ? diffs.doc2.language +
                          " : " +
                          doc2Diffs[index].originalText
                        : ""
                    }
                  </p>
                </li>
              ))}
              {
                // If there are more differences in doc2, display them
                doc2Diffs.length > doc1Diffs.length &&
                  doc2Diffs.slice(doc1Diffs.length).map((diff, index) => (
                    <li key={index + doc1Diffs.length}>
                      <strong>{diff.type}:</strong>
                      <p>{diffs.doc2.language + " : " + diff.originalText}</p>
                    </li>
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

export default ConcordanceCheck3;
