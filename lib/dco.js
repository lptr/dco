const validator = require('email-validator')

// Returns the DCO object containing state and description
// Also returns target_url (in case of failure) in object
module.exports = async function (commits, isRequiredFor) {
  const regex = /^Signed-off-by: (.*) <(.*)>$/im
  const failure = (description) => {
    return {
      state: 'failure',
      description: description.substring(0, 140),
      target_url: 'https://github.com/probot/dco#how-it-works'
    }
  }

  for (const {commit, author, parents} of commits) {
    const isMerge = parents && parents.length > 1
    if (isMerge) {
      continue
    }

    const match = regex.exec(commit.message)

    if (match === null) {
      const signoffRequired = await isRequiredFor(author.login)
      if (signoffRequired) {
        return failure(`The sign-off is missing.`)
      } else {
        if (!commit.verification.verified) {
          return failure(`Commit by organization member is not verified.`)
        }
      }
    } else {
      if (!validator.validate(commit.author.email)) {
        return failure(`${commit.author.email} is not a valid email address.`)
      } else {
        if (commit.author.name !== match[1] || commit.author.email !== match[2]) {
          return failure(`Expected "${commit.author.name} <${commit.author.email}>", but got "${match[1]} <${match[2]}>".`)
        }
      }
    }
  }
  return {
    state: 'success',
    description: 'All commits have a DCO sign-off from the author'
  }
}
