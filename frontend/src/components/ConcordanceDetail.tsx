// This component will display details of a selected concordance test
import React from "react";
import { Heading } from "@carbon/react";
import styles from "./ConcordanceDetail.module.css"; // Import the CSS module
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@carbon/react";
interface ConcordanceDetailProps {
  detail: any; // Define the type based on your data structure
}
const ConcordanceDetail: React.FC<ConcordanceDetailProps> = ({ detail }) => {
  if (!detail) {
    return (
      <div className={styles.placeholder}>Select a test to see details</div>
    );
  }

  return (
    <div className={styles.detailContainer}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Field</TableHeader>
            <TableHeader>Value</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(detail).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>{String(value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConcordanceDetail;
