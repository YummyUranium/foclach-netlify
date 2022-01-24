import { useEffect, useState, useRef } from 'react'
import { dictionary, letters, status } from './constants'
import { Keyboard } from './components/Keyboard'
import answers from './data/answers'
import words from './data/words'
import  html2canvas  from 'html2canvas'
import dailyAnswers from './data/dailyAnswers'

import { useLocalStorage } from './hooks/useLocalStorage'
import { ReactComponent as Info } from './data/Info.svg'
import { ReactComponent as Settings } from './data/Settings.svg'
import { ReactComponent as Statistics } from './data/Statistics.svg'

import { InfoModal } from './components/InfoModal'
import { SettingsModal } from './components/SettingsModal'
import { EndGameModal } from './components/EndGameModal'
import { InvalidWord } from './components/invalidWord'
import { GameStats } from './components/gameStats'
import { EndGameButtons } from './components/EndGameButtons'
import { Message } from './components/Message'


const state = {
  playing: 'playing',
  won: 'won',
  lost: 'lost',
  copiedToClipboard: false,
}

const getRandomAnswer = () => {
  const randomIndex = Math.floor(Math.random() * answers.length)
  return answers[randomIndex].toUpperCase()
}

const getTodaysAnswer = () => {
  const fullDate = new Date()
  const dateSubstring = fullDate.toISOString().substring(0, 10)
  const todaysWord = dailyAnswers[dateSubstring]['word']
  return todaysWord
}

const getAnswer = (mode) => {
  return mode ? getTodaysAnswer() : getRandomAnswer()
}

const playedAlreadyToday = (date) => {
  if (date && date.substring(0, 10) === new Date().toISOString().substring(0, 10)) {
    return true
  } else {
    return false
  }
}


function App() {
  const initialStates = {
    answer: () => getAnswer(true),
    gameState: state.playing,
    board: [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ],
    cellStatuses: () => Array(6).fill(Array(5).fill(status.unguessed)),
    currentRow: 0,
    currentCol: 0,
    letterStatuses: () => {
      const letterStatuses = {}
      letters.forEach((letter) => {
        letterStatuses[letter] = status.unguessed
      })
      return letterStatuses
    },
    invalidWord: false,
    currentGuess: '',
    message: ''
  }

  const [submittedInvalidWord, setSubmittedInvalidWord] = useState(false)
  const [answer, setAnswer] = useState(initialStates.answer)
  const [boardState, setBoardState] = useLocalStorage('boardState', null)
  const [gameMode, setGameMode] = useLocalStorage('daily', true)
  const [lastPlayedDate, setLastPlayedDate] = useLocalStorage('lastPlayedDate', null)
  const boards = gameMode && lastPlayedDate ? boardState : initialStates.board
  const [gameState, setGameState] = useState(initialStates.gameState)
  const [practiceBoard, setPracticeBoard] = useLocalStorage('practiceBoard', initialStates.board)
  const [dailyBoard, setDailyBoard] = useLocalStorage('dailyBoard', initialStates.board)
  const [board, setBoard] = useState(initialStates.board)
  const [dailyCellStatuses, setDailyCellStatuses] = useLocalStorage('dailyCellStatuses', initialStates.cellStatuses)
  const [cellStatuses, setCellStatuses] = useState(initialStates.cellStatuses)
  const [currentRow, setCurrentRow] = useState(initialStates.currentRow)
  const [currentCol, setCurrentCol] = useState(initialStates.currentCol)
  const [letterStatuses, setLetterStatuses] = useState(initialStates.letterStatuses)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [messageVisible, setMessageVisible] = useState(false)
  const [message, setMessage] = useState(initialStates.message)
  const [clipboardMessage, setClipboardMessage] = useState(false)
  
  const [currentStreak, setCurrentStreak] = useLocalStorage('current-streak', 0)
  const [longestStreak, setLongestStreak] = useLocalStorage('longest-streak', 0)
  const [wins, setWins] = useLocalStorage('wins', 0)
  const [losses, setLosses] = useLocalStorage('losses', 0)
  const [rowsPlayed, setRowsPlayed] = useState(0)
  const streakUpdated = useRef(false)
  const [modalIsOpen, setIsOpen] = useState(false)
  const [firstTime, setFirstTime] = useLocalStorage('first-time', true)
  const [infoModalIsOpen, setInfoModalIsOpen] = useState(firstTime)
  const [settingsModalIsOpen, setSettingsModalIsOpen] = useState(false)
  const [currentGuess, setCurrentGuess] = useState(initialStates.currentGuess)
  const [myResults, setMyResults] = useState('')
  const [dayModeModalOpen, setDayModeModalOpen] = useState(false)
  const [enterEvent, setEnterEvent] = useState(null)


  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const handleInfoClose = () => {
    setFirstTime(false)
    setInfoModalIsOpen(false)
  }

  const updateBoard = () => {
    const dailyModeAndPlayedToday =  gameMode && playedAlreadyToday(lastPlayedDate)
    gameMode ? setAnswer(getTodaysAnswer()) : setAnswer(getRandomAnswer())
    dailyModeAndPlayedToday ? setBoard(dailyBoard) : setBoard( initialStates.board)
    dailyModeAndPlayedToday ? setCellStatuses(dailyCellStatuses) : setCellStatuses(initialStates.cellStatuses)
    setGameState(initialStates.gameState)
    setCurrentRow(initialStates.currentRow)
    setCurrentCol(initialStates.currentCol)
    setLetterStatuses(initialStates.letterStatuses)
    setRowsPlayed(0)
    setMessage('')
    setMyResults('')
  }

  const toggleGameMode = () => {
    setGameMode((prev) => !prev)
  }

  const [darkMode, setDarkMode] = useLocalStorage('dark-mode', true)
  const toggleDarkMode = () => setDarkMode((prev) => !prev)

  // on mount event I think?
  useEffect (() => {
    
    if (gameMode && playedAlreadyToday(lastPlayedDate)) {
      setBoard(dailyBoard)
      setCellStatuses(dailyCellStatuses) 
    } else {
      setBoard(initialStates.board)
      setCellStatuses(initialStates.cellStatuses)
    }
  }, [])

  useEffect(() => {
    if (gameState !== state.playing && !gameMode) {
      setTimeout(() => {
        openModal()
      }, 500)
    } 
    if (gameState !== state.playing && gameMode) {
      setTimeout(() => {
        setDayModeModalOpen(true)
      }, 1000)    
    } 
  }, [gameState])

  useEffect(() => {
    if (!streakUpdated.current) {
      if ((gameState === state.won) && gameMode) {
        if (currentStreak >= longestStreak) {
          setLongestStreak((prev) => prev + 1)
        }
        setCurrentStreak((prev) => prev + 1)
        setWins((prev) => prev + 1)
        streakUpdated.current = true
      } else if ((gameState === state.lost) && gameMode) {
        setLosses((prev) => prev + 1)
        setCurrentStreak(0)
        streakUpdated.current = true
      }
    }
  }, [gameState, currentStreak, longestStreak, setLongestStreak, setCurrentStreak])

  useEffect(() => {
    updateBoard()
  }, [gameMode])

  const getCellStyles = (rowNumber, colNumber, letter) => {
    if (rowNumber === 0 && enterEvent !== 'Enter' ) {
      switch (cellStatuses[rowNumber][colNumber]) {
        case status.green:
          return 'rightLetterRightPlace'
        case status.yellow:
          return 'rightLetterWrongPlace'
        case status.gray:
          return 'wrongLetter'
        default:
          console.log('trying to get first row to return styles')
          return ''
      }
    }

    if (rowNumber === currentRow) {
      if (letter) {
        return ` ${
          submittedInvalidWord ? 'submittedInvalidWord border border-red-800' : ''
        }`
      }
      return ''
    }
    


    switch (cellStatuses[rowNumber][colNumber]) {
      case status.green:
        return 'rightLetterRightPlace is-flipped'
      case status.yellow:
        return 'rightLetterWrongPlace is-flipped'
      case status.gray:
        return 'wrongLetter is-flipped'
      default:
        return ''
    }
  }

  const addLetter = (letter) => {
    setSubmittedInvalidWord(false)
    setBoard((prev) => {
      if (currentCol > 4) {
        return prev
      }
      const newBoard = [...prev]
      newBoard[currentRow][currentCol] = letter
      return newBoard
    })
    if (currentCol < 5) {
      setCurrentCol((prev) => prev + 1)
    }
  }

  const isValidWord = (word) => {
    if (word.length < 5) return false
    return words[word.toLowerCase()]
  }

  const onEnterPress = (event) => {
    setEnterEvent(event && event.key)
    const word = board[currentRow].join('')
    setCurrentGuess(word)
    if (!isValidWord(word)) {
      setSubmittedInvalidWord(true)
      setMessage(`Níl ${word} sa stór focal 😿`)
      setMessageVisible(true)
      return
    } else {
      setSubmittedInvalidWord(false)
    }

    if (currentRow === 6) return

    updateCellStatuses(word, currentRow)
    updateLetterStatuses(word)
    setCurrentRow((prev) => prev + 1)
    setCurrentCol(0)
  }

  const screenShotResult = () => {
    html2canvas(document.querySelector("#gameBoard")).then(canvas => {
      state.lastCanvas = canvas
    });
  }

  const onDeletePress = (event) => {
    setSubmittedInvalidWord(false)
    setMessage('')
    setMessageVisible(false)
    if (currentCol === 0) return

    setBoard((prev) => {
      const newBoard = [...prev]
      newBoard[currentRow][currentCol - 1] = ''
      return newBoard
    })

    setCurrentCol((prev) => prev - 1)
  }

  const updateCellStatuses = (word, rowNumber) => {
    setCellStatuses((prev) => {
      const newCellStatuses = [...prev]
      newCellStatuses[rowNumber] = [...prev[rowNumber]]
      const wordLength = word.length
      const answerLetters = answer.split('')

      // set all to gray
      for (let i = 0; i < wordLength; i++) {
        newCellStatuses[rowNumber][i] = status.gray
      }

      // check greens
      for (let i = wordLength - 1; i >= 0; i--) {
        if (word[i] === answer[i]) {
          newCellStatuses[rowNumber][i] = status.green
          answerLetters.splice(i, 1)
        }
      }

      // check yellows
      for (let i = 0; i < wordLength; i++) {
        if (answerLetters.includes(word[i]) && newCellStatuses[rowNumber][i] !== status.green) {
          newCellStatuses[rowNumber][i] = status.yellow
          answerLetters.splice(answerLetters.indexOf(word[i]), 1)
        }
      }

      return newCellStatuses
    })
  }

  // checking if the answer is right
  const isRowAllGreen = (row) => {
    let correctAnswer = row.every((cell) => cell === status.green)
    if (correctAnswer) {
      screenShotResult()
    }
    return correctAnswer
  }

  const percentageStatistic = () => {
    let totalGames = losses + wins
    let percentage = wins / totalGames * 100
    let percentageType = typeof(Math.round(Number.parseFloat(percentage)))
    return percentageType === Number ? Math.round(Number.parseFloat(percentage)) : 0
  }

  // every time cellStatuses updates, check if the game is won or lost
  useEffect(() => {
    const cellStatusesCopy = [...cellStatuses]
    const reversedStatuses = cellStatusesCopy.reverse()
    const lastFilledRow = reversedStatuses.find((r) => {
      return r[0] !== status.unguessed
    })


    let gameRowEnded = 0

    if (lastFilledRow && isRowAllGreen(lastFilledRow)) {
      let lastFilledRowIndex = reversedStatuses.findIndex((r) => {
        return (r[0]) !== status.unguessed
      })
      if(gameMode) { setLastPlayedDate(new Date().toISOString())}
      setRowsPlayed(6 - lastFilledRowIndex)
      gameRowEnded = 6 - lastFilledRowIndex;
      gameMode ? setDailyBoard(board): setPracticeBoard(initialStates.board)
      if(gameMode) {setDailyCellStatuses(cellStatuses)}
      setGameState(state.won)   
      setMessage(` ⭐  Maith thú! ⭐  `)
      setMessageVisible(true)
    } else if (currentRow === 6) {
      if(gameMode) { setLastPlayedDate(new Date().toISOString())}
      gameMode ? setDailyBoard(board) : setPracticeBoard(initialStates.board)
      if(gameMode) { setDailyCellStatuses(cellStatuses)}
      setGameState(state.lost)      
      setMessage(`😿 Mí ááádh 😿  ${ answer } an freagra ceart`  )
      setMessageVisible(true)
      setRowsPlayed(6)
      gameRowEnded = 6
    }

    let results = '';

    for (var i = 0; i < gameRowEnded; i++) {
      results += printEmojis(cellStatuses[i])
    }
      setMyResults(results)
  }, [cellStatuses, currentRow])

  const printEmojis = (item) => {
    let s = '';
    for (var i = 0; i < item.length; i++) {
      switch (item[i]) {
        case "gray":
          s = s + '\u26AA';
          break;
        case "unguessed":
          s = s + '\u26AA';
          break;
        case "green":
          s = s + '💚';
          break;
        case "yellow":
          s = s + '💛';
          break;
        default:
          console.log('\u26AA', item);
          s = s + '\x0A';
      }
    }
    return (
      s = s + '\x0A '
    )
  }

  const updateLetterStatuses = (word) => {
    setLetterStatuses((prev) => {
      const newLetterStatuses = { ...prev }
      const wordLength = word.length
      for (let i = 0; i < wordLength; i++) {
        if (newLetterStatuses[word[i]] === status.green) continue

        if (word[i] === answer[i]) {
          newLetterStatuses[word[i]] = status.green
        } else if (answer.includes(word[i])) {
          newLetterStatuses[word[i]] = status.yellow
        } else {
          newLetterStatuses[word[i]] = status.gray
        }
      }
      return newLetterStatuses
    })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(myResults + "  \x0A https://lindakeating.github.io/foclach/").then(function(){
      console.log('myResults', myResults)
      setClipboardMessage(dictionary['ResultsCopiedToClipboard'])
    }, function(){
      console.log('there was a problem heuston')
    });
  }


  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0D313F'
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      height: 'calc(100% - 2rem)',
      width: 'calc(100% - 2rem)',
      background: 'rgb(25,42,73)',
      background: 'linear-gradient(180deg, rgb(47, 55, 69) 0%,    rgb(34, 66, 79) 42%, rgba(70, 107, 120, 0.995)    100%)',
      border: 'none',
      borderRadius: '1rem',
      position: 'relative',
      maxWidth: '500px'
    },
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`appContainer`}>
        <header className="appHeader">
          <button type="button" onClick={() => setSettingsModalIsOpen(true)}>
            <Settings />
          </button>
          <h1 className="siteTitle">
            FOCLACH
          </h1>
          <div>
             <button 
              className="statisticIcon"
              type="button" 
              onClick={() => setDayModeModalOpen(true)}>
            <Statistics />
          </button>
          <button type="button" onClick={() => setInfoModalIsOpen(true)}>
            <Info />
          </button>
          </div>
         
        </header>
        <div className="gameContainer">
          <div>        
           <div id="gameBoard" className="gameBoard">         
            {board.map((row, rowNumber) =>
              row.map((letter, colNumber) => (
                  <span
                    key={colNumber}
                    className={`${getCellStyles(
                    rowNumber,
                    colNumber,
                    letter,                  
                  )} letterTile`}
                  >
                    <span className="innerLetter">
                      {letter}
                    </span>
                  
                  </span>             
              ))
            )}
          </div>
          
          <div className="messageContainer">         
            <Message 
              message={message}
              messageVisible={messageVisible}
            />
          </div>
          </div>     
        </div>
        
        <InfoModal
          isOpen={infoModalIsOpen}
          handleClose={handleInfoClose}
          darkMode={darkMode}
          styles={modalStyles}
        />
        <EndGameModal
          isOpen={dayModeModalOpen}
          handleClose={() => setDayModeModalOpen(false)}
          styles={modalStyles}
          gameState={gameState}
          state={state}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          answer={answer}
          shareResults={() => {
            copyToClipboard()
          }}
          isCopied={copiedToClipboard}
          percentage={percentageStatistic()}
          totalPlayed={wins + losses}
          message={clipboardMessage}
        />
        <SettingsModal
          isOpen={settingsModalIsOpen}
          handleClose={() => setSettingsModalIsOpen(false)}
          styles={modalStyles}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          getAnswer={getAnswer}
          gameMode={gameMode}
          toggleGameMode={toggleGameMode}
        />
        <EndGameButtons
          playAgain={() => {
            setAnswer(getRandomAnswer())
            setBoard(initialStates.board)
            setGameState(initialStates.gameState)
            setCellStatuses(initialStates.cellStatuses)
            setCurrentRow(initialStates.currentRow)
            setCurrentCol(initialStates.currentCol)
            setLetterStatuses(initialStates.letterStatuses)
            setMessage('')
            setRowsPlayed(0)
            setMyResults('')
            closeModal()
            streakUpdated.current = false
          }}
          shareResults={() => {
            copyToClipboard()
          }}
          isOpen={modalIsOpen}
        ></EndGameButtons>
        <Keyboard
          isNotOpen={modalIsOpen}
          letterStatuses={letterStatuses}
          addLetter={addLetter}
          onEnterPress={onEnterPress}
          onDeletePress={onDeletePress}
          gameDisabled={gameState !== state.playing}
        />

      </div>
    </div>
  )
}

export default App
