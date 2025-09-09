import React, { useState } from "react";
import {
  Button,
  NumberInput,
  TextArea,
  InlineNotification,
  Tile,
  Tag,
} from "@carbon/react";
import axios from "axios";

type GroundTruth = {
  per_paragraph: Array<{
    paragraph_idx: number;
    original_idx: number;
    variant: number;
    errors: Array<{
      entity:
        | "money"
        | "dates"
        | "case_reference"
        | "article_number"
        | "directives_and_regulation_numbers";
      source_span: string | null;
      target_span: string | null;
      description: string;
    }>;
  }>;
  errors: {
    money: number;
    dates: number;
    case_reference: number;
    article_number: number;
    directives_and_regulation_numbers: number;
    all: number;
  };
};

interface GenResponse {
  docA: { filename: string; base64: string };
  docB: { filename: string; base64: string };
  ground_truth: GroundTruth;
}

const TestGenerator: React.FC = () => {
  const [numVariants, setNumVariants] = useState<number>(2);

  // store examples as PAIRS; one add/remove affects both
  const [exampleAList, setExampleAList] = useState<string[]>([""]);
  const [exampleBList, setExampleBList] = useState<string[]>([""]);

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<GenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setA = (i: number, val: string) =>
    setExampleAList((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  const setB = (i: number, val: string) =>
    setExampleBList((prev) => prev.map((v, idx) => (idx === i ? val : v)));

  const addPair = () => {
    setExampleAList((prev) => [...prev, ""]);
    setExampleBList((prev) => [...prev, ""]);
  };

  const removePair = () => {
    setExampleAList((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    setExampleBList((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const downloadBase64Docx = (filename: string, base64: string) => {
    const binStr = atob(base64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResp(null);
    try {
      // trim empties and keep alignment
      const A = exampleAList.map((s) => s.trim());
      const B = exampleBList.map((s) => s.trim());
      if (A.length !== B.length) {
        throw new Error("Internal error: A/B length mismatch");
      }
      const payload = {
        num_variants: numVariants,
        exampleA: A,
        exampleB: B,
      };
      const { data } = await axios.post<GenResponse>("/generateTestFiles", payload);
      setResp(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const errs = resp?.ground_truth?.errors;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <h2>Test File Generator</h2>
      <p>
        Add example paragraph pairs (one A with its matching B). Use the +/– buttons to add or remove pairs together.
        Choose how many variants to generate.
      </p>

      {/* unified add/remove controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Button kind="tertiary" onClick={addPair} size="sm">
          + Add paragraph pair
        </Button>
        <Button kind="danger--tertiary" onClick={removePair} size="sm">
          – Remove
        </Button>
      </div>

      {/* grid with paired inputs per index */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {exampleAList.map((_, i) => (
          <React.Fragment key={i}>
            <TextArea
              labelText={`Example A – paragraph ${i + 1}`}
              value={exampleAList[i]}
              onChange={(e: any) => setA(i, e.target.value)}
              placeholder="Source paragraph…"
              rows={4}
            />
            <TextArea
              labelText={`Example B – paragraph ${i + 1}`}
              value={exampleBList[i]}
              onChange={(e: any) => setB(i, e.target.value)}
              placeholder="Target paragraph…"
              rows={4}
            />
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <NumberInput
          id="numVariants"
          label="Number of variants"
          min={1}
          value={numVariants}
          onChange={(e: any, { value }: any) => setNumVariants(Number(value))}
        />
        <Button kind="primary" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "Generate test set"}
        </Button>
      </div>

      {error && (
        <InlineNotification
          title="Generation failed"
          subtitle={error}
          kind="error"
          onCloseButtonClick={() => setError(null)}
          style={{ marginTop: 16 }}
        />
      )}

      {resp && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 24,
          }}
        >
          <Tile>
            <h4>Downloads</h4>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button
                kind="secondary"
                onClick={() =>
                  downloadBase64Docx(resp.docA.filename, resp.docA.base64)
                }
              >
                Download Document A
              </Button>
              <Button
                kind="secondary"
                onClick={() =>
                  downloadBase64Docx(resp.docB.filename, resp.docB.base64)
                }
              >
                Download Document B
              </Button>
            </div>
          </Tile>

          <Tile>
            <h4>Expected errors (totals)</h4>
            {errs ? (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  <Tag type="red">money: {errs.money}</Tag>
                  <Tag type="cyan">dates: {errs.dates}</Tag>
                  <Tag type="purple">case_ref: {errs.case_reference}</Tag>
                  <Tag type="magenta">article_no: {errs.article_number}</Tag>
                  <Tag type="teal">
                    directives/regs: {errs.directives_and_regulation_numbers}
                  </Tag>
                  <Tag type="blue">all: {errs.all}</Tag>
                </div>
                <div style={{ marginTop: 12, fontSize: 14 }}>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(errs, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div style={{ marginTop: 8 }}>No errors summary found.</div>
            )}
          </Tile>

          <Tile style={{ gridColumn: "1 / span 2" }}>
            <h4>Per-paragraph ground truth</h4>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(resp.ground_truth.per_paragraph, null, 2)}
            </pre>
          </Tile>
        </div>
      )}
    </div>
  );
};

export default TestGenerator;
