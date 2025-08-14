import React, { useState } from "react";
import {
  Grid,
  Column,
  Heading,
  Accordion,
  AccordionItem,
  Toggle,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@carbon/react";
import { Theme } from "@carbon/react";
import { WarningAlt, FilterEdit } from "@carbon/react/icons";
import styles from "./ConcordanceCheck.module.css";
import { useLocation } from "react-router-dom";

// Define the shape of the data from the backend
interface Paragraph {
  document_id: number;
  language: string;
  paragraph_number: number;
  text: string;
}

interface ConcordanceCheckItem {
  paragraphs: Paragraph[];
  concordance_error: boolean;
  error_description: string;
}

interface Data {
  "document 1": string[];
  "document 2": string[];
  concordance_checks: ConcordanceCheckItem[];
}

const ConcordanceCheck = () => {
  const location = useLocation();
  const data = location.state;
  const [selectedError, setSelectedError] = useState<string | null>(null);

  // Fallback if no data is available
  if (!data) {
    return (
      <div className={styles.pageWrapper}>
        <p>
          Error: No data available. Please upload files and start analysis
          again.
        </p>
      </div>
    );
  }

  const { "document 1": doc1, "document 2": doc2, concordance_checks } = data;

  const handleAccordionToggle = (errorId: string) => {
    setSelectedError(selectedError === errorId ? null : errorId);
  };

  // Render document text (used in first version)
  const renderDocument = (doc: string[], errorParagraphs: number[]) => (
    <div className={styles.documentContainer}>
      {doc.map((line, index) => (
        <p
          key={index}
          className={
            errorParagraphs.includes(index + 1) ? styles.highlight : ""
          }
        >
          {line}
        </p>
      ))}
    </div>
  );

  // Render both documents in a table, with each paragraph in a row
  // !!!!!!!!! Still needs error handling when both docs don't have the same number of paragraphs
  const renderDocuments = (
    doc1: string[],
    doc2: string[],
    errorParagraphs: number[]
  ) => (
    <TableBody>
      {doc1.map((line, index) => (
        <TableRow
          key={index}
          className={
            errorParagraphs.includes(index + 1) ? styles.highlight : ""
          }
        >
          <TableCell>{line}</TableCell>
          <TableCell>{doc2[index]}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

  // Render concordance errors
  const renderErrors = () => (
    <Accordion>
      {concordance_checks
        .filter((error: ConcordanceCheckItem) => error.concordance_error)
        .map((error: ConcordanceCheckItem, index: number) => (
          <AccordionItem
            key={index}
            title={
              <div className={styles.discrepancyTitle}>
                <WarningAlt size={16} className={styles.discrepancyIcon} />
                {error.error_description}
              </div>
            }
            onClick={() => handleAccordionToggle(`error${index}`)}
          >
            <div className={styles.summaryBox}>
              <p>{error.error_description}</p>
              <span className={styles.aiBadge}>AI</span>
            </div>
            {error.paragraphs.map((para: Paragraph, paraIndex: number) => (
              <div key={paraIndex}>
                <p>
                  <strong>
                    {para.language.toUpperCase()} (Paragraph{" "}
                    {para.paragraph_number}):
                  </strong>{" "}
                  {para.text}
                </p>
              </div>
            ))}
          </AccordionItem>
        ))}
    </Accordion>
  );

  const errorParagraphsDoc1 = concordance_checks
    .filter((error: ConcordanceCheckItem) => error.concordance_error)
    .flatMap((error: ConcordanceCheckItem) =>
      error.paragraphs
        .filter((p: Paragraph) => p.document_id === 1)
        .map((p: Paragraph) => p.paragraph_number)
    );

  const errorParagraphsDoc2 = concordance_checks
    .filter((error: ConcordanceCheckItem) => error.concordance_error)
    .flatMap((error: ConcordanceCheckItem) =>
      error.paragraphs
        .filter((p: Paragraph) => p.document_id === 2)
        .map((p: Paragraph) => p.paragraph_number)
    );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.tableWrapper}>
        <Theme theme="g10">
          <Table aria-label="document table" background-color="white">
            {renderDocuments(doc1, doc2, errorParagraphsDoc1)}
          </Table>
        </Theme>
      </div>

      <div className={styles.outputWrapper}>
        <div className={styles.syncToggle}>
          <Toggle
            defaultToggled
            id="syncToggle"
            labelA="Sync Scrolling"
            labelB="Sync Scrolling"
          />
        </div>
        <Heading className={styles.outputTitle}>
          Concordance Output
          <span className={styles.filterIcon}>
            <FilterEdit />
          </span>
        </Heading>

        <div className={styles.accordionContainer}>{renderErrors()}</div>
      </div>
    </div>
  );
};
export default ConcordanceCheck;
