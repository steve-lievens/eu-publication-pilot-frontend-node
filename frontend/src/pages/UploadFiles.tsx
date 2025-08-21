import React, { useState } from "react";
import {
  Grid,
  Column,
  Heading,
  Tile,
  FileUploaderDropContainer,
  Button,
  Loading,
  Dropdown,
} from "@carbon/react";
import type { OnChangeData } from "@carbon/react";
import styles from "./UploadFiles.module.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UploadFiles: React.FC = () => {
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [primaryLanguage, setPrimaryLanguage] = useState<string>("en");
  const [secondaryLanguage, setSecondaryLanguage] = useState<string>("de");
  const [institution, setInstitution] = useState<string>("European Commission");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const languageOptions = [
    { id: "en", text: "English (en)" },
    { id: "de", text: "German (de)" },
    { id: "lv", text: "Latvian (lv)" },
  ];

  const institutionOptions = [
    "European Parliament",
    "European Council",
    "Council of the European Union",
    "European Commission",
    "Court of Justice of the European Union",
    "European Central Bank",
    "European Court of Auditors",
  ];

  const handlePrimaryUpload = (
    _event: React.SyntheticEvent,
    { addedFiles }: { addedFiles: File[] }
  ) => {
    const file = addedFiles[0];
    if (file) {
      setPrimaryFile(file);
    }
  };

  const handleSecondaryUpload = (
    _event: React.SyntheticEvent,
    { addedFiles }: { addedFiles: File[] }
  ) => {
    const file = addedFiles[0];
    if (file) {
      setSecondaryFile(file);
    }
  };

  const handleStartAnalysis3 = () => async () => {
    // Placeholder for future implementation
    console.log("Parsing documents...");

    if (!primaryFile || !secondaryFile) {
      return;
    }
    setLoading(true);

    let backendUrl =
      "https://eu-pub.1yqyg3g5f8e4.eu-de.codeengine.appdomain.cloud/parse-documents";

    const formData1 = new FormData();
    formData1.append("files", primaryFile);
    formData1.append("files", secondaryFile);

    try {
      const response = await axios.post(backendUrl, formData1, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // adding language to the response
      const dataInput = {
        primaryLanguage: primaryLanguage,
        secondaryLanguage: secondaryLanguage,
      };
      response.data.push(dataInput);

      console.log("Parsing response:");
      console.log(response);

      navigate("/concordance-check-3", { state: response.data });
    } catch (error) {
      console.error("Error starting analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = (useApproach2: boolean) => async () => {
    if (!primaryFile || !secondaryFile) {
      return;
    }
    setLoading(true);

    let backendUrl = "";

    const formData = new FormData();
    formData.append("document1", primaryFile);
    formData.append("document2", secondaryFile);

    if (!useApproach2) {
      formData.append("document1Language", primaryLanguage);
      formData.append("document2Language", secondaryLanguage);
      formData.append("institution", "");
      formData.append("entity_list", "amounts");
      formData.append("entity_list", "articles");
      formData.append("entity_list", "regdirs");
      formData.append("entity_list", "caselaw");
      formData.append("use_deployed_prompt", "true");

      backendUrl =
        "https://eu-pub.1yqyg3g5f8e4.eu-de.codeengine.appdomain.cloud/graph/compare-documents";
    } else {
      backendUrl =
        "https://application-eu-test.1yqyg3g5f8e4.eu-de.codeengine.appdomain.cloud/graph/compare-all";
    }

    try {
      const response = await axios.post(backendUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response);
      if (!useApproach2) {
        navigate("/concordance-check", { state: response.data });
      } else {
        navigate("/concordance-check-2", { state: response.data });
      }
    } catch (error) {
      console.error("Error starting analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid fullWidth className={styles.uploaderGrid}>
      <Loading
        withOverlay={true}
        active={loading}
        description="Analyzing documents..."
      ></Loading>
      <Column className={styles.uploadColumn} lg={10} md={8} sm={4}>
        <Tile className={styles.uploadTile}>
          <Heading className={styles.tileTitle}>Upload Documents</Heading>
          <p className={styles.tileInstructions}>
            Please start by selecting...
          </p>
          <Grid>
            <Column lg={5} md={4} sm={2}>
              <p className={styles.uploaderLabel}>Primary document</p>
              <p className={styles.uploaderNote}>Max file size is 500kb...</p>
              <FileUploaderDropContainer
                labelText={
                  primaryFile
                    ? primaryFile.name
                    : "Drag and drop or click to upload"
                }
                multiple={false}
                onAddFiles={handlePrimaryUpload}
                className={primaryFile ? styles.hasFile : ""}
              />
              <Dropdown
                id="primary-language"
                titleText="Primary document language"
                label="Select language"
                items={languageOptions}
                itemToString={(item) => (item ? item.text : "")}
                onChange={({
                  selectedItem,
                }: OnChangeData<{ id: string; text: string }>) =>
                  selectedItem && setPrimaryLanguage(selectedItem.id)
                }
                selectedItem={languageOptions.find(
                  (item) => item.id === primaryLanguage
                )}
                className={styles.dropdown}
              />
            </Column>
            <Column lg={5} md={4} sm={2}>
              <p className={styles.uploaderLabel}>Secondary document</p>
              <p className={styles.uploaderNote}>Max file size is 500kb...</p>
              <FileUploaderDropContainer
                labelText={
                  secondaryFile
                    ? secondaryFile.name
                    : "Drag and drop or click to upload"
                }
                multiple={false}
                onAddFiles={handleSecondaryUpload}
                className={secondaryFile ? styles.hasFile : ""}
              />
              <Dropdown
                id="secondary-language"
                titleText="Secondary document language"
                label="Select language"
                items={languageOptions}
                itemToString={(item) => (item ? item.text : "")}
                onChange={({
                  selectedItem,
                }: OnChangeData<{ id: string; text: string }>) =>
                  selectedItem && setSecondaryLanguage(selectedItem.id)
                }
                selectedItem={languageOptions.find(
                  (item) => item.id === secondaryLanguage
                )}
                className={styles.dropdown}
              />
            </Column>
          </Grid>
          <Grid>
            <Column lg={10} md={8} sm={4}>
              <Dropdown
                id="institution"
                titleText="Institution"
                label="Select institution"
                items={institutionOptions}
                itemToString={(item) => (item ? item : "")}
                onChange={({ selectedItem }: OnChangeData<string>) =>
                  selectedItem && setInstitution(selectedItem)
                }
                selectedItem={institution}
                className={styles.dropdown}
              />
            </Column>
          </Grid>
          <div className={styles.analysisButton}>
            <Button
              onClick={handleStartAnalysis(false)}
              disabled={
                !primaryFile ||
                !secondaryFile ||
                primaryLanguage == secondaryLanguage ||
                loading
              }
            >
              {loading
                ? "Analyzing..."
                : "Extract and Compare - All items but dates"}
            </Button>
          </div>
          <div className={styles.analysisButton}>
            <Button
              className={styles.analysisButton}
              onClick={handleStartAnalysis(true)}
              disabled={
                !primaryFile ||
                !secondaryFile ||
                primaryLanguage == secondaryLanguage ||
                loading
              }
            >
              {loading ? "Analyzing..." : "LLM as a judge - Dates and Cases"}
            </Button>
          </div>
          <div className={styles.analysisButton3}>
            <Button
              className={styles.analysisButton}
              onClick={handleStartAnalysis3()}
              disabled={
                !primaryFile ||
                !secondaryFile ||
                primaryLanguage == secondaryLanguage ||
                loading
              }
            >
              {loading ? "Analyzing..." : "Unique prompt - All numbers"}
            </Button>
          </div>
          {loading && (
            <Loading description="Processing files" withOverlay={true} />
          )}
        </Tile>
      </Column>
    </Grid>
  );
};

export default UploadFiles;
