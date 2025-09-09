import React from "react";
import { Grid, Column, Heading, Button } from "@carbon/react";
import WatsonxBox from "../components/WatsonxBox";
import ConcordanceFeedbackList from "./ConcordanceFeedbackList";
import styles from "./WelcomePage.module.css";

const WelcomePage: React.FC = () => (
  <div className={styles.pageWrapper}>
    {/* Intro Section */}
    <div className={styles.introSection}>
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <p className={styles.pageSubtitle}>Hi !</p>
        </Column>
        <Column lg={10} md={8} sm={4}>
          <Heading className={styles.pageTitle}>
            Welcome to your Concordance Checks Tool!
          </Heading>
          <p className={styles.pageSubtitle}>
            Use AI to intelligently review 2 language versions of the same legal
            documents in order to identify factual discrepancies and
            inconsistencies.
          </p>
        </Column>
        <Column lg={6} md={8} sm={4} className={styles.startButton}>
          <div className={styles.buttonRow}>
          <Button href="/start" kind="primary">
            Start a new concordance check
          </Button>
          <Button href="/testgen" kind="secondary">
            Generate test files
          </Button>
        </div>
        </Column>
      </Grid>
    </div>

    {/* Main Content Area with Two Columns */}
    <main className={styles.mainContent}>
      <Grid fullWidth className={styles.uploaderGrid}>
        {/* LEFT COLUMN */}
        <Column className={styles.uploadColumn} lg={14} md={8} sm={4}>
          <ConcordanceFeedbackList />
        </Column>
        <Column lg={2} md={0} sm={0} className={styles.aiColumn}>
          <WatsonxBox />
        </Column>
      </Grid>
    </main>
  </div>
);

export default WelcomePage;
