import styled from "@emotion/styled";
import React from "react";

import {
  ActivityBar,
  WindowHandle,
  StatusBar,
  Panel,
} from "components/mock-vscode";

import { BackgroundGradient } from "./styles/background";
import { HeadingGradient } from "./styles/heading";

export default function DesignOnceRunAnywhere320SizeXs() {
  return (
    <RootWrapperDesignOnceRunAnywhere320SizeXs>
      <Contents>
        <Heading1>Design once, Run anywhere.</Heading1>
        <VscodeDemo>
          <WindowHandle />
          <Container>
            {/* <Sidebar>
              <IPhone11ProX1></IPhone11ProX1>
            </Sidebar> */}
            <Panel />
          </Container>
          <StatusBar></StatusBar>
        </VscodeDemo>
      </Contents>
    </RootWrapperDesignOnceRunAnywhere320SizeXs>
  );
}

const RootWrapperDesignOnceRunAnywhere320SizeXs = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: row;
  align-items: start;
  gap: 10px;
  /* overflow: hidden; */
  ${BackgroundGradient}
  box-sizing: border-box;
`;

const Contents = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: center;
  flex: none;
  gap: 55px;
  box-sizing: border-box;
  padding: 64px 20px 24px;
`;

const Heading1 = styled.span`
  text-overflow: ellipsis;
  font-size: 32px;
  font-family: "Helvetica Neue", sans-serif;
  font-weight: 700;
  letter-spacing: -1px;
  ${HeadingGradient}
  text-align: center;
`;

const VscodeDemo = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: start;
  flex: 1;
  gap: 0;
  box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.48);
  border: solid 1px rgba(69, 69, 69, 1);
  border-radius: 10px;
  align-self: stretch;
  background-color: rgba(37, 37, 38, 1);
  box-sizing: border-box;
`;

const Container = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: start;
  flex: 1;
  gap: 0;
  align-self: stretch;
  box-sizing: border-box;
`;
