const cheerio = require("cheerio");
const AWS = require("aws-sdk");
const Twilio = require("twilio");
const { differenceBy } = require("lodash");
const dynamo = new AWS.DynamoDB.DocumentClient();

async function sendTwilioTextMessage(numDogs) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_DEST_NUMS,
    TWILIO_SRC_NUM: from,
  } = process.env;

  const toNums = TWILIO_DEST_NUMS.split(",");
  const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const messagePromises = toNums.map((to) =>
    client.messages.create({
      to,
      from,
      body: `there are ${numDogs} new dogs listed today`,
    })
  );

  await Promise.all(messagePromises);
}

function getPetsFromDynamo() {
  return dynamo
    .scan({
      TableName: "jrpupsnstuffdogs",
    })
    .promise();
}

function deletePetsFromDynamo(idToDelete) {
  if (idToDelete) {
    return dynamo
      .delete({
        TableName: "jrpupsnstuffdogs",
        Key: {
          dogId: idToDelete,
        },
      })
      .promise();
  } else return;
}

function savePetsToDynamo(dogs) {
  return dynamo
    .put({
      TableName: "jrpupsnstuffdogs",
      Item: {
        dogId: new Date().toString(),
        dogs,
      },
    })
    .promise();
}

function petsDiff(newPets, oldPets) {
  return differenceBy(newPets, oldPets, "id");
}

function mergeNewPets(newPets, oldPets) {
  // console.log({ newPets, oldPets });
  return [...oldPets, ...newPets];
}

function getIframeFromPetUrl(html) {
  const $ = cheerio.load(html);
  const iFrameUrl = $("iframe").attr("src");
  return iFrameUrl;
}

function getPetsFromIframeHTML(html) {
  const $ = cheerio.load(html);
  const dogs = [];
  $(".list-item").each((index, dogInfoBlock) => {
    const id = $(".list-animal-id", dogInfoBlock).text();
    if (!id) return;
    const url = `http://ws.petango.com/webservices/adoptablesearch/wsAdoptableAnimalDetails.aspx?id=${id}`;
    const photo = $(".list-animal-photo", dogInfoBlock)
      .attr("src")
      .replace("_TN1", ""); // remove the thumbnail declaration
    const name = $("a", dogInfoBlock).text();
    const [sex, spayedNeutered] = $(".list-animal-sexSN", dogInfoBlock)
      .text()
      .split("/");
    const breed = $(".list-animal-breed", dogInfoBlock).text();
    const age = $(".list-animal-age", dogInfoBlock).text();
    dogs[index] = {
      dateAdded: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      id,
      url,
      photo,
      name,
      sex,
      spayedNeutered,
      breed,
      age,
    };
  });

  return dogs;
}

module.exports = {
  getPetsFromIframeHTML,
  getIframeFromPetUrl,
  getPetsFromDynamo,
  savePetsToDynamo,
  deletePetsFromDynamo,
  petsDiff,
  mergeNewPets,
  sendTwilioTextMessage,
};
