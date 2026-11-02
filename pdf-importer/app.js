const extractBtn = document.getElementById("extractBtn");
const output = document.getElementById("output");

extractBtn.addEventListener("click", extractPDF);

async function extractPDF() {

    const file =
        document.getElementById("pdfFile").files[0];

    if(!file){
        alert("Select a PDF first");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function(){

        const typedArray =
            new Uint8Array(reader.result);

        const pdf =
            await pdfjsLib.getDocument(
                typedArray
            ).promise;

        let fullText = "";

        for(let pageNum=1;
            pageNum<=pdf.numPages;
            pageNum++){

            const page =
                await pdf.getPage(pageNum);

            const content =
                await page.getTextContent();

            const text =
                content.items
                .map(item => item.str)
                .join(" ");

            fullText += text + "\n";
        }

        const items =
            extractNutritionItems(fullText);

        output.value =
            JSON.stringify(
                items,
                null,
                2
            );
    };

    reader.readAsArrayBuffer(file);
}
