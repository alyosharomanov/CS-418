#!/bin/sh
NC=$(tput sgr0); RED=$(tput setaf 1); GREEN=$(tput setaf 2); YELLOW=$(tput setaf 3)

rm -rf ./out && mkdir ./out
rm implemented.txt && touch implemented.txt

for file in reference/*.txt; do
  file=${file##*/}
  file=${file%.txt}
  echo "${file}: \c"
  if make run file=reference/${file}.txt > /dev/null 2>&1; then
    echo "${GREEN}compiled: \c"
    mv ${file}.png out/${file}.png

    diffs=$(compare -fuzz 2% -metric AE out/${file}.png reference/${file}.png out/${file}-ae.png 2>&1)
    if [ "$diffs" = "0" ]; then
      echo "${GREEN}success\c"
      echo "$file.txt" >> implemented.txt
    else
      echo "${YELLOW}images do not match: differences: $diffs\c"
    fi

    composite out/${file}.png reference/${file}.png -compose difference out/${file}-rawdiff.png
    convert out/${file}-rawdiff.png -level 0%,8% out/${file}-diff.png
    convert +append reference/${file}.png out/${file}.png out/${file}-ae.png out/${file}-rawdiff.png out/${file}-diff.png out/${file}-out.png
    rm out/${file}.png out/${file}-ae.png out/${file}-rawdiff.png out/${file}-diff.png
  else
    echo "${RED}failed\c"
  fi
  echo "${NC}"
done