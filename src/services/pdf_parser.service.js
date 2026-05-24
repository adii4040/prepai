import { PDFParse } from 'pdf-parse'
import fs from 'fs';

// Custom render function to parse text layout accurately
async function renderPageWithColumns(pageData) {
    // Fetch the text content items from the PDF page
    const textContent = await pageData.getTextContent();
    const items = textContent.items;

    // Group text items by their vertical line position (Y-coordinate)
    // item.transform[5] represents the Y-coordinate of the text item matrix
    const linesMap = {};

    for (const item of items) {
        if (!item.str || item.str.trim() === '') continue;

        // Use a tolerance threshold (e.g., 2-3 points) to catch text on slightly uneven lines
        const yCoord = item.transform[5];
        const roundedY = Math.round(yCoord / 2) * 2;

        if (!linesMap[roundedY]) {
            linesMap[roundedY] = [];
        }

        linesMap[roundedY].push({
            text: item.str,
            x: item.transform[4] // item.transform[4] is the X-coordinate
        });
    }

    // Get all unique Y coordinates and sort them from top to bottom
    const sortedYCoordinates = Object.keys(linesMap)
        .map(Number)
        .sort((a, b) => b - a); // PDF coordinates start from 0 at the bottom, so top is highest

    let pageText = '';

    for (const y of sortedYCoordinates) {
        const lineItems = linesMap[y];

        // Crucial step: Sort the text items on this specific line from left to right
        lineItems.sort((a, b) => a.x - b.x);

        // If there's a significant horizontal gap between items on the same line,
        // add a distinctive column separator tab (\t) so Gemini recognizes the visual break.
        let lineText = '';
        for (let i = 0; i < lineItems.length; i++) {
            if (i > 0) {
                const gap = lineItems[i].x - (lineItems[i - 1].x + lineItems[i - 1].text.length * 4); // rough character width approx
                if (gap > 40) { // Adjust this threshold based on how wide your columns typically are
                    lineText += ' \t '; // Inject a structural gap indicator
                } else {
                    lineText += ' ';
                }
            }
            lineText += lineItems[i].text;
        }

        pageText += lineText + '\n';
    }

    return pageText;
}

export async function extractResumeText(filePath) {
    try {
        const options = {
            pagerender: renderPageWithColumns
        };

        console.log('EXTRACTING RESUME TEXT FROM PDF...')
        const parsedData = await new PDFParse({ url: filePath }, options);
        const parsedTextObj = await parsedData.getText();

        if(parsedTextObj.text.trim() === '' || typeof parsedTextObj.text !== 'string') {
            throw new Error("Parsed text is empty. The PDF might be image-based or have an unsupported structure.");
        }

        const cleanedParsedText = parsedTextObj.text
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();

        console.log('RESUME CONTENT FETCHED!!')
        return cleanedParsedText;
    } catch (error) {
        console.error("Column PDF Parsing Error:", error);
        throw new Error("Could not cleanly extract structured layout from resume.");
    }
}