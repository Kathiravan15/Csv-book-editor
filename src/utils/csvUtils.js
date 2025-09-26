import Papa from "papaparse";
import { faker } from "@faker-js/faker";

export async function parseCSVFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let idCounter = 1;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step: function (results) {
        const row = { id: idCounter++, ...results.data };
        rows.push(row);
        onProgress?.(rows.length);
      },
      complete: () => resolve(rows),
      error: reject,
    });
  });
}

export function downloadCSV(data, filename) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  link.click();
}

export function generateSampleData(count = 10000) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    Title: faker.lorem.words(3),
    Author: faker.person.fullName(),
    Genre: faker.music.genre(),
    PublishedYear: faker.number.int({ min: 1900, max: 2025 }).toString(),
    ISBN: faker.string.uuid(),
  }));
}
