require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const range = process.env.GOOGLE_SHEET_RANGE;
const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

const auth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ["https://www.googleapis.com/auth/spreadsheets.readonly"]
);

async function getSheetData() {
    try {
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            console.log("No data found.");
            return;
        }

        const headers = rows[0];

        const jsonData = rows.slice(1).map(row => ({
            name: row[0] || "",
            column_values: {
                due_date: row[1] || "",
                budget: {
                    value: row[2] ? parseFloat(row[2].replace(/[$,]/g, "")) : 0,
                    type: "currency"
                },
                progress: row[3] ? parseFloat(row[3].replace("%", "")) : 0,
                timeline: {
                    start_date: row[4] ? row[4].split(" - ")[0] : "",
                    end_date: row[4] ? row[4].split(" - ")[1] : ""
                },
                description: row[5] || ""
            }
        }));

        fs.writeFileSync("data.json", JSON.stringify(jsonData, null, 2));
        console.log("Data saved to data.json");
    } catch (error) {
        console.error("Error fetching Google Sheets data:", error);
    }
}

getSheetData();
