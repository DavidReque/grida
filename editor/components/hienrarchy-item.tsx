import React from "react";
import styled from "@emotion/styled";
import { Struct } from "../layout/scene-explorer";

/**
 * @description NEED MIGRATE EDITOR-X REPO, THIS IS EDITOR-X DESIGN SYSTEM
 */
function HienrachyItem(props: {
  struct: Struct;
  level: number;
  onExpand: () => void;
}) {
  const {
    struct: { title, child, type },
    level,
    onExpand,
  } = props;
  return (
    <Wrapper ml={25 + 14 * level} onClick={onExpand}>
      {child && (
        <img className="indicator" src="/assets/icons/item-indicator.svg" />
      )}
      <img className="icon" src={`/assets/icons/item-${type}.svg`} />
      <span>{title}</span>
    </Wrapper>
  );
}

export default HienrachyItem;

const Wrapper = styled.div<{ ml: number }>`
  display: flex;
  align-items: center;
  padding-left: ${(p) => p.ml}px;
  height: 30px;
  cursor: pointer;
  margin-right: 9px;

  span {
    color: #fff;
    font-size: 12px;
  }

  .icon {
    margin-left: 5px;
    margin-right: 4px;
  }
`;
