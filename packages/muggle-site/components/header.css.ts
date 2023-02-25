import { style } from "@vanilla-extract/css";

export const link = style({
  position: "relative",
  display: "inline-block",
  margin: 12,
  textDecoration: "none",
  color: "black",
  overflow: "hidden",
  "::after": {
    content: '""',
    position: "relative",
    display: "block",
    width: "100%",
    height: "4px",
    backgroundColor: "rgba(255, 0, 0, 0.5)",
    transition: "all 0.5s ease",
  },
  selectors: {
    "&:hover::after": {
      transform: "translateX(calc(100% + 5px))",
    },
  },
});

export const actvieLink = style([
  link,
  {
    fontStyle: "italic",
    selectors: {
      "&:hover::after": {
        transform: "none",
      },
    },
  },
]);

export default "";
