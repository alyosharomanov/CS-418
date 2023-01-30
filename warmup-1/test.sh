#!/bin/sh
echo "Running Makefile:"
rm mp0ex1.png && rm mp0ex2.png
make run file=mp0ex1.txt && make run file=mp0ex2.txt

rm -rf ./out && mkdir ./out && cd ./out
mv ../mp0ex1.png mp0ex1.png && mv ../mp0ex2.png mp0ex2.png

echo "Running Comparison mp0ex1:"
compare -fuzz 2% mp0ex1.png ../reference/mp0ex1-ref.png mp0ex1-ae.png
composite mp0ex1.png ../reference/mp0ex1-ref.png -compose difference mp0ex1-rawdiff.png
convert mp0ex1-rawdiff.png -level 0%,8% mp0ex1-diff.png
convert +append ../reference/mp0ex1-ref.png mp0ex1.png mp0ex1-ae.png mp0ex1-rawdiff.png mp0ex1-diff.png mp0ex1-out.png

echo "Running Comparison mp0ex2:"
compare -fuzz 2% mp0ex2.png ../reference/mp0ex2-ref.png mp0ex2-ae.png
composite mp0ex2.png ../reference/mp0ex2-ref.png -compose difference mp0ex2-rawdiff.png
convert mp0ex2-rawdiff.png -level 0%,8% mp0ex2-diff.png
convert +append ../reference/mp0ex2-ref.png mp0ex2.png mp0ex2-ae.png mp0ex2-rawdiff.png mp0ex2-diff.png mp0ex2-out.png
