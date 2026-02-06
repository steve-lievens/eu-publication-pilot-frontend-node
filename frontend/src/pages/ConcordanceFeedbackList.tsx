// This component will display all Concordance test sessions that have been run
import React, { useEffect, useState } from "react";

import {
  Grid,
  Column,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
} from "@carbon/react";
import { Link } from "react-router-dom";
import styles from "./ConcordanceFeedbackList.module.css";

export default function ConcordanceFeedbackList() {
  const [concordanceTests, setConcordanceTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to truncate long text
  const truncateText = (text: string, maxLength: number = 50): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  useEffect(() => {
    const fetchConcordanceTests = async () => {
      try {
        const response = await fetch("/getAllConcordanceTests");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setConcordanceTests(data);
      } catch (error) {
        console.error("Error fetching concordance tests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConcordanceTests();
  }, []);
  const headers = [
    { key: "timestamp", header: "Timestamp" },
    { key: "docA", header: "Document A" },
    { key: "docB", header: "Document B" },
    { key: "paragraphCount", header: "# of P" },
    { key: "analysisCount", header: "# of Diffs" },
    { key: "appVersion", header: "Version" },
    { key: "actions", header: "Actions" },
  ];

  const rows = concordanceTests
    .slice() // avoid mutating state
    .sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .map((test: any) => ({
      timestamp: new Date(test.timestamp).toLocaleString("NL-be", {
        timeZone: "Europe/Brussels",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      docA: (
        <span title={test.docA} className={styles.truncatedCell}>
          {truncateText(test.docA)}
        </span>
      ),
      docB: (
        <span title={test.docB} className={styles.truncatedCell}>
          {truncateText(test.docB)}
        </span>
      ),
      paragraphCount: test.paragraphCount,
      analysisCount: test.analysisCount,
      appVersion: test.appVersion,
      id: test._id,
      actions: (
        <Link to={`/feedback/${test._id}`}>
          <Button size="sm" kind="tertiary">
            View Details
          </Button>
        </Link>
      ),
    }));
  /*
  const rows = concordanceTests.map((test: any) => ({
    timestamp: new Date(test.timestamp).toLocaleString("NL-be", {
      timeZone: "Europe/Brussels",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    docA: test.docA,
    docB: test.docB,
    paragraphCount: test.paragraphCount,
    analysisCount: test.analysisCount,
    appVersion: test.appVersion,
    id: test._id,
    actions: (
      <Link to={`/feedback/${test._id}`}>
        <Button size="sm" kind="tertiary">
          View Details
        </Button>
      </Link>
    ),
  }));
*/
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.introSection}>
        <Grid fullWidth>
          <Column lg={16} md={8} sm={4}>
            <p className={styles.pageSubtitle}>
              Below is a list of all your previously run concordance test
              sessions. Click "View Details" to see more information about each
              session.
            </p>
          </Column>
        </Grid>
      </div>
      <main className={styles.mainContent}>
        <Grid fullWidth className={styles.uploaderGrid}>
          <Column lg={16} md={8} sm={4} className={styles.tableColumn}>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <DataTable rows={rows} headers={headers} isSortable>
                {({ rows, headers, getTableProps }) => (
                  <TableContainer title=" ">
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map((header) => (
                            <TableHeader key={header.key}>
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.cells.map((cell) => (
                              <TableCell key={cell.id}>{cell.value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            )}
          </Column>
        </Grid>
      </main>
    </div>
  );
}
