/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { assert } from "chai";
import { mount, ReactWrapper, shallow, ShallowWrapper } from "enzyme";
import * as React from "react";
import * as sinon from "sinon";

import { Classes, FileUpload } from "../../src/index";

describe("<FileUpload>", () => {
    it("supports className, fill, & large", () => {
        const CUSTOM_CLASS = "foo";
        const wrapper = shallow(<FileUpload className={CUSTOM_CLASS} fill={true} large={true} />);
        assert.isTrue(wrapper.hasClass(Classes.FILE_UPLOAD), "Classes.FILE_UPLOAD");
        assert.isTrue(wrapper.hasClass(CUSTOM_CLASS), CUSTOM_CLASS);
        assert.isTrue(wrapper.hasClass(Classes.FILL), "Classes.FILL");
        assert.isTrue(wrapper.hasClass(Classes.LARGE), "Classes.LARGE");
    });

    it("supports custom input props", () => {
        const wrapper = mount(
            <FileUpload
                inputProps={{
                    className: "bar",
                    required: true,
                    type: "text", // overridden by type="file"
                }}
            />,
        );
        const input = getInput(wrapper);

        assert.isTrue(input.hasClass("bar"), "has custom class");
        assert.isTrue(input.prop("required"), "required attribute");
        assert.strictEqual(input.prop("type"), "file", "type attribute");
    });

    it("applies top-level disabled prop to the root and input (overriding inputProps.disabled)", () => {
        const wrapper = mount(<FileUpload disabled={true} inputProps={{ disabled: false }} />);
        const input = getInput(wrapper);

        // should ignore inputProps.disabled in favor of the top-level prop
        assert.isTrue(wrapper.hasClass(Classes.DISABLED), "wrapper has disabled class");
        assert.isTrue(input.prop("disabled"), "input is disabled");

        wrapper.setProps({ disabled: false, inputProps: { disabled: true } });

        // ensure inputProps.disabled is overriden in this case too
        assert.isFalse(wrapper.hasClass(Classes.DISABLED), "wrapper no longer has disabled class");
        assert.isFalse(input.prop("disabled"), "input no longer disabled");
    });

    it("renders default or custom text", () => {
        const wrapper = mount(<FileUpload />);
        const span = wrapper.find(`.${Classes.FILE_UPLOAD_INPUT}`);

        // default text
        assert.strictEqual(span.text(), "Choose file...");

        // custom text
        wrapper.setProps({ text: "Upload file..." });
        assert.strictEqual(span.text(), "Upload file...");
    });

    it("onChange works", () => {
        const onChange = sinon.spy();
        const wrapper = shallow(<FileUpload inputProps={{ onChange }} />);
        const input = getInput(wrapper);
        input.simulate("change");
        assert.isTrue(onChange.calledOnce);
    });
});

function getInput(wrapper: ShallowWrapper<any, any> | ReactWrapper<any, any>) {
    return wrapper.find("input");
}
