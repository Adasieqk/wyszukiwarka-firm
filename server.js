import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import ExcelJS from "exceljs";

const app = express();
const PORT = 3000;

app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

function splitAddress(address) {
    const postalCodeRegex = /(\d{2}-\d{3})/;
    const match = address.match(postalCodeRegex);
    let code = "";
    let addr = address;
    if (match) {
        code = match[0];
        addr = address.replace(match[0], "").replace(/[,]/, "").replace(/\s\s+/g, " ").trim();
    }
    return { code, addr };
}

async function getPageCount(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml',
                'Referer': 'https://panoramafirm.pl/'
            }
        });
        const $ = cheerio.load(response.data);
        const lastPageLink = $("a.text-dark.py-1[data-paginatorpage]").last();
        if (lastPageLink.length) {
            return parseInt(lastPageLink.attr("data-paginatorpage"), 10);
        }
        return 1;
    } catch (err) {
        console.error("Błąd pobierania liczby stron:", err.message);
        return 1;
    }
}

async function getFirmDataFromPage(url) {
    try {
        console.log(`Pobieram dane ze strony: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml',
                'Referer': 'https://panoramafirm.pl/'
            }
        });
        const $ = cheerio.load(response.data);

        const firms = [];

        $("li.company-item").each((i, el) => {
            const name = $(el).find("a.company-name.addax.addax-cs_hl_hit_company_name_click").text().trim() || "";
            const phone = $(el).find("a.icon-telephone.addax.addax-cs_hl_phonenumber_click").attr("title") || "";
            const email = $(el).find("a.ajax-modal-link.icon-envelope.cursor-pointer.addax.addax-cs_hl_email_submit_click").attr("data-company-email") || "";
            const rawAddress = $(el).find("div.address").text().trim().replace(/\s\s+/g, " ") || "";

            const { code, addr } = splitAddress(rawAddress);

            firms.push({ name, phone, email, address: addr, postalCode: code });
        });

        return firms;
    } catch (err) {
        console.error("Błąd pobierania firm na stronie:", err.message);
        return [];
    }
}

app.get("/api/search", async (req, res) => {
    const { job, location } = req.query;
    if (!job || !location) return res.status(400).json({ error: "Brak danych" });

    const encodedJob = encodeURIComponent(job);
    const encodedLoc = encodeURIComponent(location);
    const baseUrl = `https://panoramafirm.pl/${encodedJob}/${encodedLoc}/firmy`;

    try {
        const pageCount = await getPageCount(`${baseUrl},1.html`);
        let allFirms = [];

        for (let page = 1; page <= pageCount; page++) {
            const pageUrl = `${baseUrl},${page}.html`;
            const firms = await getFirmDataFromPage(pageUrl);
            console.log(`Strona ${page}: pobrano ${firms.length} firm`);
            allFirms.push(...firms);
        }

        console.log(`Razem pobrano firm: ${allFirms.length}`);

        if (allFirms.length === 0) {
            return res.json({ filePath: null, message: "Brak danych do zapisania" });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Firmy");

        worksheet.columns = [
            { header: "Nazwa Firmy", key: "name", width: 50 },
            { header: "Adres", key: "address", width: 60 },
            { header: "Kod pocztowy", key: "postalCode", width: 15 },
            { header: "Email", key: "email", width: 40 },
            { header: "Telefon", key: "phone", width: 20 }
        ];

        allFirms.forEach((firm) => {
            worksheet.addRow({
                name: firm.name,
                address: firm.address,
                postalCode: firm.postalCode,
                email: firm.email,
                phone: firm.phone
            });
        });

        const folderPath = path.join(__dirname, "PLIKI");
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

        const timestamp = Date.now();
        const filename = `${job.replace(/\s+/g, "_")}_${location.replace(/\s+/g, "_")}_${timestamp}.xlsx`;
        const filepath = path.join(folderPath, filename);

        await workbook.xlsx.writeFile(filepath);
        console.log(`Zapisano dane do pliku: ${filepath}`);
        console.log(`Liczba firm zapisanych do pliku: ${allFirms.length}`);

        res.json({ filePath: filepath, message: "Dane zostały zapisane poprawnie." });
    } catch (err) {
        console.error("Błąd głównej funkcji:", err.message);
        res.status(500).json({ error: "Błąd podczas pobierania danych" });
    }
});

app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
