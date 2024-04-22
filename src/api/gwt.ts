
export async function getGreekWord(strongs : string) {
	strongs = await makeFourDigitStrongs(
		strongs
	).toLocaleLowerCase();
	let folder = await getStrongsRange(strongs);

    let greekWordInfo;

    try {
      const response = await fetch(
        `https://content.bibletranslationtools.org/WycliffeAssociates/en_gwt/raw/branch/master/${folder}/${strongs}.md`
      );
  
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
  
      greekWordInfo = await response.text();
  
      return greekWordInfo;
    } catch (error) {
      console.error(error);
      return undefined;
    }
}


// Takes the target strongs number and calculates its parent folder in the en_gwt repo
// This is greatly dependent on the current structure of the en_gwt
export function getStrongsRange(strongs : String) {
	let thousandsDigit = strongs.charAt(1);
	let hundredsDigit = strongs.charAt(2);
	let tensDigit = strongs.charAt(3);
	let onesDigit = strongs.charAt(4);

	let strongsNumberStr : string =
		thousandsDigit + hundredsDigit + tensDigit + onesDigit;

	let strongsNumber = parseInt(strongsNumberStr);

	let startStrongsRangeNumber;
	let endStrongsRangeNumber;

	if (strongsNumber <= 10) {
		return "g0001-g0010";
	} else if (parseInt(onesDigit) === 0) {
		startStrongsRangeNumber = strongsNumber - 9;
		endStrongsRangeNumber = strongsNumber;
	} else {
		startStrongsRangeNumber =
			strongsNumber - (strongsNumber % 10) + 1;
		endStrongsRangeNumber =
			strongsNumber - (strongsNumber % 10) + 10;
	}

	let startStrongsRangeString = makeFourDigitStrongs(
		"g" + startStrongsRangeNumber
	);
	let endStrongsRangeString = makeFourDigitStrongs(
		"g" + endStrongsRangeNumber
	);

	let strongsRange = (startStrongsRangeString + "-").concat(
		endStrongsRangeString
	);

	return strongsRange.toLocaleLowerCase();
}


// utility function to insert a string into another string
function stringInsert(str: string, index : number, value : string, replace : boolean) {
	let res = "";

	if (replace === false) {
		res = str.substr(0, index) + value + str.substr(index);
	} else {
		res =
			str.substr(0, index) +
			value +
			str.substr(index + value.length);
	}

	return res;
}



// Adds padding zeros (to the second character's posision) until it's length is 5
function makeFourDigitStrongs(strongs : string) {
	if (strongs.length < 5 && strongs.length >= 2) {
		for (let i = strongs.length; i < 5; i++) {
			strongs = stringInsert(strongs, 1, "0", false);
		}
	}

	return strongs;
}