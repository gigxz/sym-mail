

function openDraft(draft) {
	// TODO should be going to compose, not read. drafts must have uids for this.
   	window.location.href = '/compose/%5BGmail%5D%2FDrafts/'+$(draft).attr('uid');

}

