// Integration point for the Palm Reading AI (owned by the AI workstream).
//
// palmReadingService calls analyzePalm() and stores whatever it returns, so
// connecting the real model only requires replacing the body of analyzePalm().
// Nothing else in the palm reading endpoint needs to change.
//
// Input:
//   { imageUrl: string, handType: "left" | "right" | null }
//
// Expected result (every line field is optional; interpretation is required):
//   {
//     handShape: string | null,      // stored in palm_reading.hand_shape (max 100 chars)
//     lifeLine: string | null,
//     heartLine: string | null,
//     headLine: string | null,
//     fateLine: string | null,
//     interpretation: string,        // the reading shown to the user
//   }
//
// Throw PalmAnalysisUnavailableError when the analyzer cannot run at all
// (not configured, provider down); the API answers 503. Any other thrown
// error is treated as a failed analysis and the API answers 502.

class PalmAnalysisUnavailableError extends Error {
  constructor(message = "Palm analysis is not configured.") {
    super(message);
    this.name = "PalmAnalysisUnavailableError";
  }
}

async function analyzePalm({ imageUrl, handType }) {
  // TODO(AI): call the Palm Reading AI here and return the result shape above.
  throw new PalmAnalysisUnavailableError();
}

module.exports = { analyzePalm, PalmAnalysisUnavailableError };
