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
} from "@carbon/react";
import { FilterEdit } from "@carbon/react/icons";
import styles from "./ConcordanceCheck3.module.css";
import { useLocation } from "react-router-dom";
import axios from "axios";

interface ParagraphData {
  para: string;
  para_number: number;
}

interface AnalysisResult {
  diffs: {};
  paraNumber: number;
}

const ConcordanceCheck3: React.FC = () => {
  const location = useLocation();
  const retData = location.state;
  const data = {
    docA: retData[0].file,
    docB: retData[1].file,
    paragraphsA: retData[0].para,
    paragraphsB: retData[1].para,
  };

  console.log("ConcordanceCheck3 data:", data);

  const [highlightedPara, setHighlightedPara] = useState<number | null>(null);
  const paragraphRef = useRef<(HTMLDivElement | null)[]>([]);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[]>([]);
  const [loadingTitle, setLoadingTitle] = useState<string>("Analyzing ...");

  const analyzeParagraph = async (
    paragraphA: ParagraphData,
    paragraphB: ParagraphData
  ) => {
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
      diffs: {},
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
      const resultFull = response.data;
      console.log("Result :", resultFull);
      if (resultFull.differences) {
        resultData.diffs = resultFull.differences;
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
    for (let i = 0; i < data.paragraphsA.length; i++) {
      console.log("INFO: Starting analysis of paragraph ", i + 1);
      const result = await analyzeParagraph(
        data.paragraphsA[i],
        data.paragraphsB[i]
      );
      console.log("INFO: Result for paragraph ", i + 1, ":", result);

      // Only add non-empty results
      if (!(JSON.stringify(result.diffs) === "{}")) results.push(result);
      setAnalysisResult([...results]);
    }

    setLoadingTitle("No differences found");
  };

  // This code start to run on page load
  useEffect(() => {
    if (!analysisDone) {
      console.log("Analyzing paragraphs:", data.paragraphsA, data.paragraphsB);

      // Analyze paragraphs and set the result
      console.log("INFO: Starting analysis...");
      analyzeParagraphs();
      setAnalysisDone(true);
    }
  }, [data]);

  const scrollToDiv = (idx: number) => {
    console.log("Scrolling to paragraph:", idx);
    paragraphRef.current[idx]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // Highlight the paragraph
    setHighlightedPara(idx);
  };

  if (!data) return <p>Error: no data.</p>;

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
            ></div>
            {index + 1}
          </TableCell>
          <TableCell className={styles.paraTableCell}>
            <div>{para.para}</div>
          </TableCell>
          <TableCell className={styles.paraTableCell}>
            <div>{paragraphB[index].para}</div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div>
      <Heading className={styles.title}>
        Comparing: {data.docA} vs {data.docB}
      </Heading>

      <div className={styles.pageWrapper}>
        <div className={styles.tableWrapper}>
          <Theme theme="g10">
            <Table
              aria-label="document table"
              background-color="white"
              className={styles.tableFixed}
            >
              <TableBody>
                {renderDocuments(
                  data.docA,
                  data.docB,
                  data.paragraphsA,
                  data.paragraphsB,
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
                      open={false}
                      className={styles.accordionItem}
                      onClick={() => {
                        console.log("Clicked on paragraph", result.paraNumber);
                        scrollToDiv(result.paraNumber);
                      }}
                    >
                      {JSON.stringify(result.diffs, null, 2)}
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
