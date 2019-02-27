const tape = require('tape')
const levelup = require('level-test')()

const blobs = function() {
	return require('../')(levelup('test-level-blobs'))
}

const allocer = function() {
	let i = 0

	return function() {
		const buf = new Buffer(50000)

		buf.fill(i++)

		return buf
	}
}

tape('write + read', function(t) {
	const bl = blobs()

	const output = []
	const alloc = allocer()
	const ws = bl.createWriteStream('test')

	ws.on('finish', function() {
		const rs = bl.createReadStream('test')

		const input = []

		rs.on('data', function(data) {
			input.push(data)
		})

		rs.on('end', function() {
			t.same(Buffer.concat(input), Buffer.concat(output))
			t.end()
		})
	})

	for (let i = 0; i < 25; i++) {
		const b = alloc()

		output.push(b)

		ws.write(b)
	}

	ws.end()
})

tape('random access', function(t) {
	const bl = blobs()

	const output = []
	const alloc = allocer()
	const ws = bl.createWriteStream('test')

	ws.on('finish', function() {
		const rs = bl.createReadStream('test', { start: 77777 })

		const input = []

		rs.on('data', function(data) {
			input.push(data)
		})

		rs.on('end', function() {
			t.same(Buffer.concat(input).length, Buffer.concat(output).slice(77777).length)
			t.same(Buffer.concat(input), Buffer.concat(output).slice(77777))

			t.end()
		})
	})

	for (let i = 0; i < 3; i++) {
		const b = alloc()

		output.push(b)

		ws.write(b)
	}

	ws.end()
})

// TODO: failing

tape('append', function(t) {
	const bl = blobs()

	const output = []
	const alloc = allocer()
	const ws = bl.createWriteStream('test')

	ws.on('finish', function() {
		const ws = bl.createWriteStream('test', { append: true })

		ws.on('finish', function() {
			const rs = bl.createReadStream('test')

			const input = []

			rs.on('data', function(data) {
				input.push(data)
			})

			rs.on('end', function() {
				t.same(Buffer.concat(input).length, Buffer.concat(output).length)
				t.same(Buffer.concat(input).toString('hex'), Buffer.concat(output).toString('hex'))

				t.end()
			})
		})

		for (let i = 0; i < 3; i++) {
			const b = alloc()

			output.push(b)

			ws.write(b)
		}

		ws.end()
	})

	for (let i = 0; i < 3; i++) {
		const b = alloc()

		output.push(b)

		ws.write(b)
	}

	ws.end()
})
