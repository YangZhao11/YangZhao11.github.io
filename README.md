# Nonogram solver
[nonogram solver](nonogram.html)

Nonogram is a puzzle game where you try to figure out a 2D pixel image
(only black and white) with summary information on each row / column.

The information on a row / column goes like this: go along the line,
either from top to bottom (for columns) or left to right (for rows).
As you encounter a consecutive segment of black pixels, write down the
length of this segment. The line is summarized as several segments of
black pixels. The white pixels are not explicitly mentioned, except
that segments of black pixels are separated by at least 1 white pixel.

For example, the following pattern would be given as "2 3 4":

```
..◼◼.◼◼◼...◼◼◼◼
```

and also this pattern:

```
◼◼..◼◼◼.◼◼◼◼...
```

The game is to figure out exactly what is the underlying pattern, by
some deduction and cross-referencing between rows and columns.

## An Example

Lets look at this 5x4 puzzle.

```
     1111
    11111
1 2 .....
  1 .....
2 2 .....
  1 .....
```

Checking the columns, there is not much one can infer from `1 1`
columns, since we have 4 rows in total. Each pixel can be black or
white.

For the `1 2` row, the leftmost position is this:

```
1 2 ◼.◼◼.
```

The rightmost position is this:

```
1 2 .◼.◼◼
```
So the `2` segment has limited movement. We could deduce that the 4th
pixel from left must be black.

Similarly, `2 2` row can be completely decided.

```
     1111
    11111
1 2 ...◼.
  1 .....
2 2 ◼◼x◼◼
  1 .....
```

Here we are marking a white pixel with `x`, to differentiate it with
undecided pixels. Note this white pixel can help decide on the third
column: the second `1` must be below this white pixel (since we can not
fix two `1`s before it), so we can deduce that the middle pixel in the
last row is black.

This deduction goes on till one figures out all the pixels, and the
puzzle is solved.

```
     1111
    11111
1 2 x◼x◼◼
  1 xx◼xx
2 2 ◼◼x◼◼
  1 xx◼xx
```
