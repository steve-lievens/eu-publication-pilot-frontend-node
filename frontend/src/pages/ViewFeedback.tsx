// Displays all the feedback of a certain check, showing all items in a table
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Grid,
  Column,
} from "@carbon/react";
import styles from "./ViewFeedback.module.css"; // Import the CSS module
import ConcordanceDetail from "../components/ConcordanceDetail";

export default function FeedbackList() {
  const { feedbackId } = useParams();
  const [concordanceTests, setConcordanceTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [concorcanceTestDetails, setConcordanceTestDetails] = useState(null);

  console.log("Feedback ID from URL:", feedbackId);

  useEffect(() => {
    const fetchConcordanceTests = async () => {
      try {
        const response = await fetch(
          "/getConcordanceTestDetails?feedbackId=" + feedbackId
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setConcordanceTests(data.docs);
      } catch (error) {
        console.error("Error fetching concordance tests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConcordanceTests();
  }, [feedbackId]);

  const onButtonDetail = (test: any) => {
    console.log("View Details clicked for test:", test);
    // Implement navigation to detailed view if needed
    setConcordanceTestDetails(test);
  };

  const headers = [
    { key: "feedbacktype", header: "Result" },
    { key: "paragraphNumber", header: "Paragraph" },
    { key: "feedback", header: "Feedback" },
    { key: "actions", header: "Actions" },
  ];
  const rows = concordanceTests
    .slice() // avoid mutating state
    .sort((a: any, b: any) => {
      // Put "thumbsDown" feedbacktype first
      if (a.feedbacktype === "thumbsDown" && b.feedbacktype !== "thumbsDown")
        return -1;
      if (a.feedbacktype !== "thumbsDown" && b.feedbacktype === "thumbsDown")
        return 1;
      // If feedbacktype is the same, sort by paragraphNumber
      return a.paragraphNumber - b.paragraphNumber;
    })
    .map((test: any) => ({
      id: test._id,
      feedbacktype: test.feedbacktype,
      paragraphNumber: test.paragraphNumber,
      feedback: test.feedback,
      actions: (
        <Button size="sm" kind="tertiary" onClick={() => onButtonDetail(test)}>
          View Details
        </Button>
      ),
    }));
  /*
  const rows = concordanceTests.map((test: any) => ({
    id: test._id,
    feedbacktype: test.feedbacktype,
    paragraphNumber: test.paragraphNumber,
    feedback: test.feedback,

    actions: (
      <Button size="sm" kind="tertiary" onClick={() => onButtonDetail(test)}>
        View Details
      </Button>
    ),
  }));
  */

  return (
    <div className={styles.pageWrapper}>
      <Grid fullWidth>
        <Column lg={8} md={8} sm={4}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <DataTable rows={rows} headers={headers} isSortable>
              {({ rows, headers, getTableProps }) => (
                <TableContainer
                  title={"Concordance Test Session " + feedbackId}
                >
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
        <Column lg={8} md={8} sm={4}>
          <div className={styles.infoBox}>
            <ConcordanceDetail detail={concorcanceTestDetails} />
          </div>
        </Column>
      </Grid>
    </div>
  );
}
