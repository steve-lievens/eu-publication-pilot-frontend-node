// This component will display details of a selected concordance test
import React from "react";
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
  function flattenObject(obj: any, prefix = ""): [string, any][] {
    let entries: [string, any][] = [];
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        entries = entries.concat(flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (item && typeof item === "object") {
            entries = entries.concat(flattenObject(item, `${newKey}[${idx}]`));
          } else {
            entries.push([`${newKey}[${idx}]`, item]);
          }
        });
      } else {
        entries.push([newKey, value]);
      }
    }
    return entries;
  }

  if (!detail) {
    return (
      <div className={styles.placeholder}>Select a test to see details</div>
    );
  }

  const flatEntries = flattenObject(detail);

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
          {flatEntries.map(([key, value]) => (
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
