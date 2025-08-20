import React from "react";
import { Grid, Column, Heading } from "@carbon/react";
import styles from "./StartAnalysis.module.css";
import UploadFiles from "../pages/UploadFiles";
import WatsonxBox from "../components/WatsonxBox";

const StartAnalysis: React.FC = () => {
  return (
    <div>
      <div className={styles.introSection}>
        <Grid fullWidth>
          <Column lg={16} md={8} sm={4}>
            <Heading className={styles.pageTitle}>Concordance Checks</Heading>
            <p className={styles.pageSubtitle}>
              Use AI to intelligently review 2 language versions of the same
              legal documents in order to identify factual discrepancies and
              inconsistencies.
            </p>
          </Column>
        </Grid>
      </div>

      <main className={styles.mainContent}>
        <UploadFiles></UploadFiles>
        <Column lg={6} md={0} sm={0} className={styles.aiColumn}>
          <WatsonxBox />
        </Column>
      </main>
    </div>
  );
};

export default StartAnalysis;
