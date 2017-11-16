export default (startDate, endDate) => {
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  if (startISO.substr(0, 10) === endISO.substr(0, 10)) {  // 'YYYY-MM-DD' matches
    return startDate.format('MMM D, YYYY');
  } else if (startISO.substr(0, 7) === endISO.substr(0, 7)) {  // 'YYYY-MM' matches
    return `${
      startDate.format('MMM D')
    }&thinsp;&ndash;&thinsp;${
      endDate.format('D, YYYY')
    }`;
  } else if (startISO.substr(0, 4) === endISO.substr(0, 4)) {  // 'YYYY' matches
    return `${
      startDate.format('MMM D')
    }&thinsp;&ndash;&thinsp;${
      endDate.format('MMM D, YYYY')
    }`;
  }

  return `${
    startDate.format('MMM D, YYYY')
  }&thinsp;&ndash;&thinsp;${
    endDate.format('MMM D, YYYY')
  }`;
};
