import { render, click, fillIn } from "@ember/test-helpers";
import { tracked } from "@glimmer/tracking";
import setupRenderingTest from "dummy/tests/helpers/setup-rendering-test";
import { hbs } from "ember-cli-htmlbars";
import { setupMirage } from "ember-cli-mirage/test-support";
import { setupIntl } from "ember-intl/test-support";
import fileSaver from "file-saver";
import { module, test } from "qunit";
import sinon from "sinon";

module("Integration | Component | document-details", function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, "en");
  setupMirage(hooks);

  test("it renders document information", async function (assert) {
    this.selectedDocument = {
      title: "Test",
      category: { color: "#F00" },
      createdAt: new Date(1998, 11, 11),
      createdByUser: "user1",
      createdByGroup: "group1",
    };

    await render(hbs`<DocumentDetails @document={{this.selectedDocument}} />`);

    assert.dom("[data-test-file-details]").doesNotHaveClass("closed");
    assert.dom("[data-test-title-container]").hasStyle({ cursor: "text" });
    assert.dom("[data-test-title-icon]").hasStyle({ color: "rgb(255, 0, 0)" });

    assert.dom("[data-test-title]").hasText(this.selectedDocument.title);
    assert.dom("[data-test-created-at]").hasText("Created on 12/11/1998");
    assert
      .dom("[data-test-created-by-user]")
      .hasText(this.selectedDocument.createdByUser);
    assert
      .dom("[data-test-created-by-group]")
      .hasText(this.selectedDocument.createdByGroup);

    assert.dom("[data-test-close]").exists();
    assert.dom("[data-test-delete]").exists();
    assert.dom("[data-test-download]").exists();
  });

  test("closed state", async function (assert) {
    this.set("selectedDocument", null);

    await render(hbs`<DocumentDetails @document={{this.selectedDocument}} />`);

    assert.dom("[data-test-file-details]").hasClass("closed");

    this.set("selectedDocument", {});

    assert.dom("[data-test-file-details]").doesNotHaveClass("closed");
  });

  test("download", async function (assert) {
    const stub = sinon.stub(fileSaver, "saveAs");

    const downloadUrl = "http://earh.planet",
      title = "test1";

    this.selectedDocument = {
      title,
      files: [{ name: "foo.txt", type: "original", downloadUrl }],
    };

    await render(hbs`<DocumentDetails @document={{this.selectedDocument}} />`);

    await click("[data-test-download]");
    assert.equal(
      stub.args[0][0],
      downloadUrl,
      "saveAs was called with correct downloadUrl"
    );
    assert.equal(
      stub.args[0][1],
      `${title}.txt`,
      "saveAs was called with correct file name"
    );
  });

  test("delete document", async function (assert) {
    this.selectedDocument = {
      id: 1,
      title: "Test",
      destroyRecord: sinon.fake(),
    };
    await render(hbs`<DocumentDetails @document={{this.selectedDocument}}/>`);

    await click("[data-test-delete]");
    await click(`[data-test-delete-confirm="${this.selectedDocument.id}"]`);

    assert.ok(
      this.selectedDocument.destroyRecord.calledOnce,
      "destroyRecord was called once"
    );
  });

  test("edit document title", async function (assert) {
    // To prevent:
    // Error: Assertion Failed: You attempted to update [object Object].title to "edited", but it is being tracked by a tracking context, such as a template, computed property, or observer. In order to make sure the context updates properly, you must invalidate the property when updating it. You can mark the property as `@tracked`, or use `@ember/object#set` to do this.
    class Document {
      @tracked title = "unedited";
      save = sinon.fake();
    }
    this.selectedDocument = new Document();
    await render(hbs`<DocumentDetails @document={{this.selectedDocument}}/>`);

    assert.dom("[data-test-title]").exists();
    assert.dom("[data-test-title-input]").doesNotExist();

    await click("[data-test-title]");

    assert.dom("[data-test-title]").doesNotExist();
    assert.dom("[data-test-title-input]").exists();

    assert.dom("[data-test-title-input]").hasValue("unedited");

    await fillIn("[data-test-title-input]", "");
    assert.dom("[data-test-title-input]").hasValue("");
    assert.dom("[data-test-save]").hasClass("uk-disabled");

    await fillIn("[data-test-title-input]", "edited");
    assert.dom("[data-test-title-input]").hasValue("edited");

    await click("[data-test-save]");

    assert.dom("[data-test-title]").exists();
    assert.dom("[data-test-title-input]").doesNotExist();

    assert.ok(this.selectedDocument.save.calledOnce, "save was called once");
  });
});
