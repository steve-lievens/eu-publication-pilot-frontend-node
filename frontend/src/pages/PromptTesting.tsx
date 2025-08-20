import React from "react";
import { Grid, Form, Column, Heading, Button, TextInput } from "@carbon/react";
import { Run as RunIcon } from "@carbon/icons-react";

import styles from "./PromptTesting.module.css";

const PromptTesting: React.FC = () => {
  const handleSubmit = (_event: React.SyntheticEvent) => {
    _event.preventDefault();
    console.log("Clicking the Search button ...");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Intro Section */}
      <div className={styles.introSection}>
        <Grid fullWidth>
          <Column lg={16} md={8} sm={4}>
            <Heading className={styles.pageTitle}>
              Test your individual prompts
            </Heading>
            <p className={styles.pageSubtitle}>
              Enter your prompt API url and test your prompts against the
              paragraphs you want to check.
            </p>
          </Column>
          <Column lg={16} md={8} sm={4} className="landing-page_nav">
            <Form onSubmit={handleSubmit}>
              <Grid className="">
                <Column lg={12} md={8} sm={4} className="padding-top-16">
                  <TextInput
                    className="my-promptapiurl-input"
                    size="lg"
                    placeholder="Enter your prompt API URL"
                    labelText="Prompt API URL"
                    id="promptAPIUrl"
                  />
                </Column>
                <Column lg={4} md={8} sm={4}></Column>
              </Grid>

              <Button type="submit" renderIcon={RunIcon}>
                Execute
              </Button>
            </Form>
          </Column>
        </Grid>
      </div>
    </div>
  );
};

export default PromptTesting;
